<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::where('is_active', true)->get();
        return response()->json($branches);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:branches,name|max:255',
            'city' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = Auth::guard('api')->user();

        $branch = Branch::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'city' => $request->city ?? 'Addis Ababa',
            'address' => $request->address,
            'phone' => $request->phone,
            'is_active' => true,
        ]);

        
        activity()
            ->performedOn($branch)
            ->causedBy($user)
            ->log('Created branch: ' . $branch->name);

        return response()->json($branch, 210);
    }

    public function destroy($id)
    {
        $branch = Branch::findOrFail($id);
        $branchName = $branch->name;
        $branch->delete();

        $user = Auth::guard('api')->user();

        
        activity()
            ->performedOn($branch)
            ->causedBy($user)
            ->log('Deleted branch: ' . $branchName);

        return response()->json(['message' => 'Branch successfully deleted']);
    }
}
