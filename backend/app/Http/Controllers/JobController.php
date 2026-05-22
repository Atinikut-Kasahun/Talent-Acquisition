<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class JobController extends Controller
{
    
    public function index(Request $request)
    {
        $query = JobPosting::with('branches')
            ->where('status', 'published')
            ->orderBy('created_at', 'desc');

        
        if ($request->has('department') && $request->department !== 'all') {
            $query->where('department', $request->department);
        }

        
        if ($request->has('location') && $request->location !== 'all') {
            $location = $request->location;
            $query->whereHas('branches', function ($q) use ($location) {
                $q->where('slug', $location)
                  ->orWhere('name', $location);
            });
        }

        return response()->json($query->get());
    }

    
    public function show($slug)
    {
        $job = JobPosting::with('branches')
            ->where('slug', $slug)
            ->firstOrFail();

        
        $job->increment('views');

        return response()->json($job);
    }

    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'employment_type' => 'required|string|in:Full Time,Part Time,Contract,Internship',
            'about' => 'required|string',
            'what_you_do' => 'required|array',
            'about_you' => 'required|array',
            'bonus' => 'nullable|array',
            'salary_range' => 'nullable|string|max:255',
            'status' => 'required|string|in:draft,published,closed',
            'branches' => 'required|array', 
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = Auth::guard('api')->user();

        $job = JobPosting::create([
            'title' => $request->title,
            'slug' => Str::slug($request->title) . '-' . Str::random(4),
            'department' => $request->department,
            'employment_type' => $request->employment_type,
            'about' => $request->about,
            'what_you_do' => $request->what_you_do,
            'about_you' => $request->about_you,
            'bonus' => $request->bonus,
            'salary_range' => $request->salary_range,
            'status' => $request->status,
            'created_by' => $user->id,
        ]);

        
        $job->branches()->sync($request->branches);

        
        activity()
            ->performedOn($job)
            ->causedBy($user)
            ->withProperties(['title' => $job->title])
            ->log('Created job posting: ' . $job->title);

        return response()->json($job->load('branches'), 210);
    }

    
    public function update(Request $request, $id)
    {
        $job = JobPosting::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'department' => 'sometimes|required|string|max:255',
            'employment_type' => 'sometimes|required|string|in:Full Time,Part Time,Contract,Internship',
            'about' => 'sometimes|required|string',
            'what_you_do' => 'sometimes|required|array',
            'about_you' => 'sometimes|required|array',
            'bonus' => 'nullable|array',
            'salary_range' => 'nullable|string|max:255',
            'status' => 'sometimes|required|string|in:draft,published,closed',
            'branches' => 'sometimes|required|array',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $job->update($request->except('branches'));

        if ($request->has('branches')) {
            $job->branches()->sync($request->branches);
        }

        $user = Auth::guard('api')->user();

        
        activity()
            ->performedOn($job)
            ->causedBy($user)
            ->log('Updated job posting: ' . $job->title);

        return response()->json($job->load('branches'));
    }

    
    public function destroy($id)
    {
        $job = JobPosting::findOrFail($id);
        $jobTitle = $job->title;
        $job->delete();

        $user = Auth::guard('api')->user();

        
        activity()
            ->performedOn($job)
            ->causedBy($user)
            ->log('Deleted job posting: ' . $jobTitle);

        return response()->json(['message' => 'Job posting successfully deleted']);
    }
}
