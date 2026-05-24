<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    /**
     * Get all users the current user can chat with (all system users except themselves).
     */
    public function users()
    {
        $me = Auth::guard('api')->user();
        $users = User::where('id', '!=', $me->id)
            ->where('is_active', true)
            ->get(['id', 'name', 'email', 'role', 'avatar']);

        // Attach last message and unread count for each user
        $users = $users->map(function ($user) use ($me) {
            $lastMessage = Message::where(function ($q) use ($me, $user) {
                    $q->where('sender_id', $me->id)->where('receiver_id', $user->id);
                })->orWhere(function ($q) use ($me, $user) {
                    $q->where('sender_id', $user->id)->where('receiver_id', $me->id);
                })
                ->latest()
                ->first();

            $unread = Message::where('sender_id', $user->id)
                ->where('receiver_id', $me->id)
                ->where('read', false)
                ->count();

            $user->last_message = $lastMessage;
            $user->unread_count = $unread;
            return $user;
        });

        return response()->json($users);
    }

    /**
     * Get conversation messages between the current user and another user.
     */
    public function conversation($userId)
    {
        $me = Auth::guard('api')->user();

        // Mark messages as read
        Message::where('sender_id', $userId)
            ->where('receiver_id', $me->id)
            ->where('read', false)
            ->update(['read' => true]);

        $messages = Message::where(function ($q) use ($me, $userId) {
                $q->where('sender_id', $me->id)->where('receiver_id', $userId);
            })->orWhere(function ($q) use ($me, $userId) {
                $q->where('sender_id', $userId)->where('receiver_id', $me->id);
            })
            ->with('sender:id,name,avatar')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Send a message to another user.
     */
    public function send(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|uuid|exists:users,id',
            'body'        => 'required|string|max:5000',
        ]);

        $me = Auth::guard('api')->user();

        $message = Message::create([
            'sender_id'   => $me->id,
            'receiver_id' => $request->receiver_id,
            'body'        => $request->body,
        ]);

        $message->load('sender:id,name,avatar');

        return response()->json($message, 201);
    }
}
