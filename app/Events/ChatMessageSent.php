<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct($message)
    {
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->message->type === 'private') {
            // 私聊消息，使用私有频道
            return [
                new PrivateChannel('chat.private.' . $this->message->sender_id),
                new PrivateChannel('chat.private.' . $this->message->receiver_id),
            ];
        }
        
        // 世界聊天，使用公共频道
        return [
            new Channel('chat'),
        ];
    }

    public function broadcastAs()
    {
        return 'MessageSent';
    }

    /**
     * 获取广播数据
     */
    public function broadcastWith()
    {
        return [
            'message' => $this->message
        ];
    }
}
