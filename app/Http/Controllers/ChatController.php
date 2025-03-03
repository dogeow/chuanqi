<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Chat;
use App\Events\ChatMessageSent;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    /**
     * 获取聊天消息
     */
    public function getMessages(Request $request)
    {
        $type = $request->input('type', 'world');
        $query = Chat::with(['sender', 'receiver'])->where('type', $type);
        
        if ($type === 'private') {
            $query->where(function ($q) {
                $userId = Auth::id();
                $q->where('sender_id', $userId)
                  ->orWhere('receiver_id', $userId);
            });
        }
        
        return $query->paginate(50);
    }

    /**
     * 发送聊天消息
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'content' => 'required|string|max:255',
            'type' => 'required|in:world,private',
            'receiver_id' => 'required_if:type,private|exists:users,id',
        ]);

        $chat = Chat::create([
            'sender_id' => Auth::id(),
            'content' => $request->content,
            'type' => $request->type,
            'receiver_id' => $request->receiver_id,
        ]);

        $message = $chat->load(['sender', 'receiver']);
        
        // 广播消息事件
        broadcast(new ChatMessageSent($message))->toOthers();

        return $message;
    }
}
