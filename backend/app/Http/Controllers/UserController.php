<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('company')->orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|max:255',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:superadmin,admin,hr,viewer',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'company_id' => $request->company_id,
            'is_active' => true,
        ]);

        $admin = Auth::guard('api')->user();

        
        activity()
            ->performedOn($user)
            ->causedBy($admin)
            ->log("Created user: {$user->name} ({$user->email})");

        return response()->json($user->load('company'), 210);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id . '|max:255',
            'role' => 'sometimes|required|string|in:superadmin,admin,hr,viewer',
            'company_id' => 'nullable|exists:companies,id',
            'is_active' => 'sometimes|required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user->update($request->all());

        $admin = Auth::guard('api')->user();

        
        activity()
            ->performedOn($user)
            ->causedBy($admin)
            ->log("Updated user details for: {$user->name}");

        return response()->json($user->load('company'));
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        
        $admin = Auth::guard('api')->user();
        if ($admin->id === $user->id) {
            return response()->json(['error' => 'Cannot delete your own active administrator account'], 400);
        }

        $userName = $user->name;
        $user->delete();

        
        activity()
            ->performedOn($user)
            ->causedBy($admin)
            ->log("Deleted user: {$userName}");

        return response()->json(['message' => 'User successfully deleted']);
    }

    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        $admin = Auth::guard('api')->user();

        
        activity()
            ->performedOn($user)
            ->causedBy($admin)
            ->log("Reset password for user: {$user->name}");

        return response()->json(['message' => 'Password reset successfully']);
    }
}
