<?php

namespace App\Http\Controllers;

use App\Models\JobApplication;
use App\Models\JobPosting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Models\Activity;

class ApplicationController extends Controller
{
    /**
     * Pipeline analytics for the HR Manager dashboard.
     *
     * "Stage friction" is an average of (now - updated_at) in days for
     * applications currently sitting in each active status — i.e. how long
     * the current cohort has been stuck there. This is a real, honest proxy
     * computed from actual timestamps; it isn't a true historical
     * stage-duration audit (that would need a status-change log table this
     * schema doesn't have yet).
     *
     * "Offer acceptance rate" is likewise a proxy: offered / (offered +
     * rejected) across all applications that ever reached those two
     * terminal-ish statuses, since there's no distinct accepted/declined
     * field. Flagged as an approximation in the response.
     */
    public function pipelineStats()
    {
        $statusCounts = JobApplication::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $avgAgeByStatus = JobApplication::selectRaw(
            "status, AVG(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 86400) as avg_days"
        )
            ->whereIn('status', ['new', 'reviewing', 'shortlisted', 'interviewed', 'offered'])
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->status => round((float) $row->avg_days, 1)]);

        $offeredCount = (int) ($statusCounts['offered'] ?? 0);
        $rejectedCount = (int) ($statusCounts['rejected'] ?? 0);
        $offerAcceptanceRate = ($offeredCount + $rejectedCount) > 0
            ? round(($offeredCount / ($offeredCount + $rejectedCount)) * 100, 1)
            : null;

        return response()->json([
            'status_counts' => $statusCounts,
            'avg_days_in_status' => $avgAgeByStatus,
            'offer_acceptance_rate' => $offerAcceptanceRate,
            'offer_acceptance_rate_note' => 'Approximation: offered / (offered + rejected) across all applications. No dedicated accepted/declined field exists yet.',
        ]);
    }

    
    public function index(Request $request)
    {
        $query = JobApplication::with(['jobPosting', 'reviewer'])
            ->orderBy('created_at', 'desc');

        
        if ($request->has('job_posting_id')) {
            $query->where('job_posting_id', $request->job_posting_id);
        }

        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'ilike', '%' . $search . '%')
                  ->orWhere('last_name', 'ilike', '%' . $search . '%')
                  ->orWhere('email', 'ilike', '%' . $search . '%');
            });
        }

        // Filter for active vs archived view
        if ($request->has('is_archived')) {
            $isArchived = filter_var($request->is_archived, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_archived', $isArchived);
        } else {
            $query->where('is_archived', false);
        }

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    
    public function show($id)
    {
        $application = JobApplication::with(['jobPosting', 'reviewer', 'media'])->findOrFail($id);

        // Build structured media payload
        $resumeMedia  = $application->getFirstMedia('resume');
        $photoMedia   = $application->getFirstMedia('photo');
        $certMedia    = $application->getMedia('certifications');

        $application->resume_url = $resumeMedia  ? $resumeMedia->getUrl()  : null;
        $application->photo_url  = $photoMedia   ? $photoMedia->getUrl()   : null;

        $application->certifications_list = $certMedia->map(fn($m) => [
            'name'         => $m->name,
            'file_name'    => $m->file_name,
            'url'          => $m->getUrl(),
            'mime_type'    => $m->mime_type,
            'size'         => $m->human_readable_size,
        ]);

        // Activity log (most recent 20 events)
        $activity = Activity::where('subject_type', JobApplication::class)
            ->where('subject_id', $application->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($a) => [
                'id'          => $a->id,
                'description' => $a->description,
                'causer'      => $a->causer ? $a->causer->name : 'System',
                'properties'  => $a->properties,
                'created_at'  => $a->created_at->toISOString(),
            ]);

        $application->activity_log = $activity;

        return response()->json($application);
    }

    
    public function store(Request $request, $jobId)
    {
        $job = JobPosting::findOrFail($jobId);

        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'linkedin_url' => 'nullable|url|max:255',
            'portfolio_url' => 'nullable|url|max:255',
            'cover_letter' => 'nullable|string',
            'answers' => 'nullable|array',
            'referred_by' => 'nullable|string|max:255',
            'resume' => 'required|file|mimes:pdf,doc,docx|max:10240', 
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'cert_files' => 'nullable|array',
            'cert_files.*' => 'file|mimes:pdf,jpeg,png,jpg,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $application = JobApplication::create([
            'job_posting_id' => $job->id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'linkedin_url' => $request->linkedin_url,
            'portfolio_url' => $request->portfolio_url,
            'cover_letter' => $request->cover_letter,
            'answers' => $request->answers,
            'referred_by' => $request->referred_by,
            'ip_address' => $request->ip(),
            'status' => 'new',
        ]);

        
        if ($request->hasFile('resume')) {
            $application->addMediaFromRequest('resume')
                ->toMediaCollection('resume');
        }

        if ($request->hasFile('photo')) {
            $application->addMediaFromRequest('photo')
                ->toMediaCollection('photo');
        }

        if ($request->hasFile('cert_files')) {
            $certNames = [];
            if (!empty($request->answers) && isset($request->answers['certifications'])) {
                $certNames = json_decode($request->answers['certifications'], true) ?: [];
            }
            
            $files = $request->file('cert_files');
            // If it's not an array for some reason, wrap it
            if (!is_array($files)) {
                $files = [$files];
            }
            
            foreach (array_values($files) as $index => $file) {
                $customName = $certNames[$index] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $application->addMedia($file)
                    ->usingName($customName)
                    ->toMediaCollection('certifications');
            }
        }

        
        activity()
            ->performedOn($application)
            ->withProperties(['name' => $request->first_name . ' ' . $request->last_name])
            ->log('New job application submitted for: ' . $job->title);

        return response()->json([
            'message' => 'Application submitted successfully!',
            'application' => $application
        ], 210);
    }

    
    public function bulkUpdateStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'application_ids' => 'required|array',
            'application_ids.*' => 'string|exists:job_applications,id',
            'status' => 'required|string|in:new,reviewing,shortlisted,written_exam,technical_exam,interviewed,offered,rejected,withdrawn',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = Auth::guard('api')->user();
        $applications = JobApplication::whereIn('id', $request->application_ids)->get();

        $updatedCount = 0;
        $skippedCount = 0;
        $newStatus = $request->status;

        foreach ($applications as $application) {
            if ($application->status === $newStatus) {
                $skippedCount++;
            } else {
                $oldStatus = $application->status;
                $application->update([
                    'status' => $newStatus,
                    'reviewed_by' => $user->id,
                    'reviewed_at' => now(),
                ]);
                $updatedCount++;

                activity()
                    ->performedOn($application)
                    ->causedBy($user)
                    ->withProperties(['old_status' => $oldStatus, 'new_status' => $newStatus, 'bulk' => true])
                    ->log('Bulk updated application status to ' . $newStatus . ' for: ' . $application->first_name . ' ' . $application->last_name);
            }
        }

        return response()->json([
            'message' => 'Bulk update processed',
            'updated_count' => $updatedCount,
            'skipped_count' => $skippedCount,
            'target_status' => $newStatus
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $application = JobApplication::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:new,reviewing,shortlisted,written_exam,technical_exam,interviewed,offered,rejected,withdrawn',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = Auth::guard('api')->user();

        $oldStatus = $application->status;
        $application->update([
            'status' => $request->status,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        
        activity()
            ->performedOn($application)
            ->causedBy($user)
            ->withProperties(['old_status' => $oldStatus, 'new_status' => $request->status])
            ->log('Updated application status for: ' . $application->first_name . ' ' . $application->last_name);

        return response()->json([
            'message' => 'Application status updated successfully!',
            'application' => $application
        ]);
    }

    
    public function updateNotes(Request $request, $id)
    {
        $application = JobApplication::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = Auth::guard('api')->user();

        $application->update([
            'notes' => $request->notes,
        ]);

        
        activity()
            ->performedOn($application)
            ->causedBy($user)
            ->log('Updated internal notes on application for: ' . $application->first_name . ' ' . $application->last_name);

        return response()->json([
            'message' => 'Application notes updated successfully!',
            'application' => $application
        ]);
    }

    /**
     * Toggle the is_starred (recruiter bookmark) flag on an application.
     */
    public function toggleStar($id)
    {
        $application = JobApplication::findOrFail($id);
        $user = Auth::guard('api')->user();

        $application->update([
            'is_starred' => !$application->is_starred,
        ]);

        $action = $application->is_starred ? 'Starred' : 'Unstarred';

        activity()
            ->performedOn($application)
            ->causedBy($user)
            ->withProperties(['is_starred' => $application->is_starred])
            ->log("{$action} application for: {$application->first_name} {$application->last_name}");

        return response()->json([
            'message'    => "Application {$action} successfully!",
            'is_starred' => $application->is_starred,
        ]);
    }

    /**
     * Archive or Restore a single application.
     */
    public function toggleArchive($id)
    {
        $application = JobApplication::findOrFail($id);
        $user = Auth::guard('api')->user();

        $application->update([
            'is_archived' => !$application->is_archived,
        ]);

        $action = $application->is_archived ? 'Archived' : 'Restored';

        activity()
            ->performedOn($application)
            ->causedBy($user)
            ->withProperties(['is_archived' => $application->is_archived])
            ->log("{$action} application for: {$application->first_name} {$application->last_name}");

        return response()->json([
            'message'     => "Application {$action} successfully!",
            'is_archived' => $application->is_archived,
        ]);
    }

    /**
     * Bulk Archive or Restore applications.
     */
    public function bulkArchive(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'application_ids' => 'required|array',
            'application_ids.*' => 'string|exists:job_applications,id',
            'is_archived' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::guard('api')->user();
        $isArchived = $request->is_archived;
        $action = $isArchived ? 'Archived' : 'Restored';

        $updatedCount = JobApplication::whereIn('id', $request->application_ids)
            ->where('is_archived', '!=', $isArchived)
            ->update(['is_archived' => $isArchived]);

        if ($updatedCount > 0) {
            activity()
                ->causedBy($user)
                ->withProperties([
                    'is_archived' => $isArchived,
                    'application_ids' => $request->application_ids
                ])
                ->log("Bulk {$action} {$updatedCount} applications");
        }

        return response()->json([
            'message' => "Successfully {$action} {$updatedCount} applications.",
            'updated_count' => $updatedCount
        ]);
    }

    /**
     * Soft delete a single application.
     */
    public function destroy($id)
    {
        $application = JobApplication::findOrFail($id);
        $user = Auth::guard('api')->user();

        $application->delete(); // Soft delete

        activity()
            ->performedOn($application)
            ->causedBy($user)
            ->log("Deleted application for: {$application->first_name} {$application->last_name}");

        return response()->json([
            'message' => 'Application deleted successfully.',
        ]);
    }

    /**
     * Bulk soft delete applications.
     */
    public function bulkDestroy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'application_ids' => 'required|array',
            'application_ids.*' => 'string|exists:job_applications,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::guard('api')->user();

        $deletedCount = JobApplication::whereIn('id', $request->application_ids)->delete();

        if ($deletedCount > 0) {
            activity()
                ->causedBy($user)
                ->withProperties(['application_ids' => $request->application_ids])
                ->log("Bulk Deleted {$deletedCount} applications");
        }

        return response()->json([
            'message' => "Successfully deleted {$deletedCount} applications.",
            'deleted_count' => $deletedCount
        ]);
    }
}
