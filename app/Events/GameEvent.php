<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $type;
    public $data;
    public $mapId;

    /**
     * Create a new event instance.
     */
    public function __construct(string $type, array $data, int $mapId = null)
    {
        $this->type = $type;
        $this->data = $data;
        $this->mapId = $mapId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if ($this->mapId) {
            // 如果指定了地图ID，则广播到该地图的频道
            return [
                new PresenceChannel('map.' . $this->mapId),
            ];
        }
        
        // 否则广播到全局游戏频道
        return [
            new Channel('game'),
        ];
    }
    
    /**
     * 获取广播事件的名称
     */
    public function broadcastAs(): string
    {
        return 'game.event';
    }

    /**
     * 获取广播数据
     */
    public function broadcastWith(): array
    {
        return [
            'type' => $this->type,
            'data' => $this->data
        ];
    }
}
