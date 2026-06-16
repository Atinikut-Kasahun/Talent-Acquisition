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
            ->get(['id', 'name', 'email', 'role', 'avatar', 'phone']);

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
            'body'        => 'nullable|string|max:5000',
            'attachment'  => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf,doc,docx|max:10240', // 10MB max
        ]);

        $me = Auth::guard('api')->user();

        $attachmentUrl = null;
        $attachmentType = null;
        $attachmentName = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $path = $file->store('chat_attachments', 'public');
            $attachmentUrl = '/storage/' . $path;
            
            $mime = $file->getClientMimeType();
            if (str_starts_with($mime, 'image/')) {
                $attachmentType = 'image';
            } elseif ($mime === 'application/pdf') {
                $attachmentType = 'pdf';
            } else {
                $attachmentType = 'doc';
            }
        }

        if (!$request->body && !$attachmentUrl) {
            return response()->json(['error' => 'Message body or attachment is required'], 422);
        }

        $message = Message::create([
            'sender_id'       => $me->id,
            'receiver_id'     => $request->receiver_id,
            'body'            => $request->body,
            'attachment_url'  => $attachmentUrl,
            'attachment_type' => $attachmentType,
            'attachment_name' => $attachmentName,
        ]);

        $message->load('sender:id,name,avatar');

        return response()->json($message, 201);
    }

    /**
     * Get unread notifications for the current user.
     */
    public function notifications()
    {
        $me = Auth::guard('api')->user();

        $messages = Message::where('receiver_id', $me->id)
            ->where('read', false)
            ->with('sender:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        return response()->json($messages);
    }

    /**
     * Delete a conversation with another user.
     */
    public function deleteConversation($userId)
    {
        $me = Auth::guard('api')->user();

        // Delete all messages between $me and $userId
        Message::where(function ($q) use ($me, $userId) {
                $q->where('sender_id', $me->id)->where('receiver_id', $userId);
            })->orWhere(function ($q) use ($me, $userId) {
                $q->where('sender_id', $userId)->where('receiver_id', $me->id);
            })->delete();

        return response()->json(['message' => 'Conversation deleted successfully']);
    }

    /**
     * Delete specific messages.
     */
    public function deleteMessages(Request $request)
    {
        $request->validate([
            'message_ids'   => 'required|array',
            'message_ids.*' => 'uuid|exists:messages,id',
        ]);

        $me = Auth::guard('api')->user();

        Message::whereIn('id', $request->message_ids)
            ->where(function ($q) use ($me) {
                $q->where('sender_id', $me->id)->orWhere('receiver_id', $me->id);
            })->delete();

        return response()->json(['message' => 'Messages deleted successfully']);
    }
}
