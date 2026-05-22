<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if (! $token = Auth::guard('api')->attempt($validator->validated())) {
            return response()->json(['error' => 'Unauthorized / Invalid Credentials'], 401);
        }

        $user = Auth::guard('api')->user();

        
        activity()
            ->performedOn($user)
            ->causedBy($user)
            ->log('User logged in successfully');

        return $this->createNewToken($token);
    }

    public function logout()
    {
        $user = Auth::guard('api')->user();
        
        if ($user) {
            activity()
                ->performedOn($user)
                ->causedBy($user)
                ->log('User logged out');
        }

        Auth::guard('api')->logout();

        return response()->json(['message' => 'User successfully signed out']);
    }

    public function refresh()
    {
        return $this->createNewToken(Auth::guard('api')->refresh());
    }

    public function me()
    {
        return response()->json(Auth::guard('api')->user());
    }

    protected function createNewToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
            'user' => Auth::guard('api')->user()
        ]);
    }
}
