<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatController;




Route::post('auth/login', [AuthController::class, 'login']);

Route::get('jobs', [JobController::class, 'index']);
Route::get('jobs/{slug}', [JobController::class, 'show']);
Route::post('jobs/{id}/apply', [ApplicationController::class, 'store']);

Route::get('branches', [BranchController::class, 'index']);


Route::group(['middleware' => 'auth:api'], function () {
    
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::post('auth/avatar', [AuthController::class, 'updateAvatar']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);
    Route::get('auth/me', [AuthController::class, 'me']);

    // Chat routes (available to all authenticated users)
    Route::get('chat/users', [ChatController::class, 'users']);
    Route::get('chat/conversation/{userId}', [ChatController::class, 'conversation']);
    Route::delete('chat/conversation/{userId}', [ChatController::class, 'deleteConversation']);
    Route::post('chat/messages/delete', [ChatController::class, 'deleteMessages']);
    Route::post('chat/send', [ChatController::class, 'send']);
    Route::get('chat/notifications', [ChatController::class, 'notifications']);

    // Applications routes (broader access based on frontend navigation config)
    Route::group(['middleware' => 'role:superadmin,admin,hr,viewer,managing director,HR manager'], function () {
        Route::get('admin/applications', [ApplicationController::class, 'index']);
        Route::get('admin/applications/{id}', [ApplicationController::class, 'show']);
        Route::put('admin/applications/bulk-status', [ApplicationController::class, 'bulkUpdateStatus']);
        Route::put('admin/applications/bulk-archive', [ApplicationController::class, 'bulkArchive']);
        Route::delete('admin/applications/bulk-delete', [ApplicationController::class, 'bulkDestroy']);
        Route::put('admin/applications/{id}/status', [ApplicationController::class, 'updateStatus']);
        Route::patch('admin/applications/{id}/archive', [ApplicationController::class, 'toggleArchive']);
        Route::delete('admin/applications/{id}', [ApplicationController::class, 'destroy']);
        Route::post('admin/applications/{id}/notes', [ApplicationController::class, 'updateNotes']);
        Route::patch('admin/applications/{id}/star', [ApplicationController::class, 'toggleStar']);
    });

    // Admin-only routes
    Route::group(['middleware' => 'role:superadmin,admin'], function () {
        
        Route::post('admin/jobs', [JobController::class, 'store']);
        Route::put('admin/jobs/{id}', [JobController::class, 'update']);
        Route::delete('admin/jobs/{id}', [JobController::class, 'destroy']);

        
        Route::post('admin/branches', [BranchController::class, 'store']);
        Route::delete('admin/branches/{id}', [BranchController::class, 'destroy']);

        
        Route::get('admin/users', [UserController::class, 'index']);
        Route::post('admin/users', [UserController::class, 'store']);
        Route::put('admin/users/{id}', [UserController::class, 'update']);
        Route::delete('admin/users/{id}', [UserController::class, 'destroy']);
        Route::post('admin/users/{id}/reset-password', [UserController::class, 'resetPassword']);

        
        Route::get('admin/companies', [CompanyController::class, 'index']);
        Route::post('admin/companies', [CompanyController::class, 'store']);
        Route::put('admin/companies/{id}', [CompanyController::class, 'update']);
        Route::delete('admin/companies/{id}', [CompanyController::class, 'destroy']);

        
        Route::get('admin/logs', [ActivityLogController::class, 'index']);
    });
});
