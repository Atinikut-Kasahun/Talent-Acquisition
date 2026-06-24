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

        return response()->json($query->paginate(20));
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
            'application_ids.*' => 'integer|exists:job_applications,id',
            'status' => 'required|string|in:new,reviewing,shortlisted,interviewed,offered,rejected,withdrawn',
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
            'status' => 'required|string|in:new,reviewing,shortlisted,interviewed,offered,rejected,withdrawn',
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
}
