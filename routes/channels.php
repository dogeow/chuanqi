<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Character;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// 全局游戏频道
Broadcast::channel('game', function () {
    return true;
});

// 地图频道，需要验证玩家是否在该地图中
Broadcast::channel('map.{mapId}', function ($user, $mapId) {
    $character = Character::where('user_id', $user->id)->first();
    if (!$character || $character->current_map_id != $mapId) {
        return false;
    }
    
    return [
        'id' => $character->id,
        'name' => $character->name,
        'level' => $character->level,
        'position_x' => $character->position_x,
        'position_y' => $character->position_y,
    ];
});

// 聊天频道，所有人都可以访问
Broadcast::channel('chat', function () {
    return true;
});

// 私聊频道，只有发送者和接收者可以访问
Broadcast::channel('chat.private.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
