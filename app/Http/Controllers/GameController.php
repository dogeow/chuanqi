<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\Map;
use App\Models\Monster;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameController extends Controller
{
    /**
     * 显示游戏主页
     */
    public function index(Request $request)
    {
        // 如果会话中没有令牌，但用户已登录，则生成一个新令牌
        if (!$request->session()->has('game_token') && Auth::check()) {
            // 删除旧令牌
            Auth::user()->tokens()->delete();
            
            // 生成新令牌
            $token = Auth::user()->createToken('game-token')->plainTextToken;
            
            // 存储到会话
            $request->session()->put('game_token', $token);
        }
        
        return view('game.index');
    }

    /**
     * 获取角色信息
     */
    public function getCharacter()
    {
        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            // 如果用户没有角色，自动创建一个
            $character = new Character([
                'name' => $user->name . '的角色',
                'level' => 1,
                'exp' => 0,
                'max_hp' => 100,
                'current_hp' => 100,
                'max_mp' => 50,
                'current_mp' => 50,
                'attack' => 10,
                'defense' => 5,
                'current_map_id' => 1, // 默认从第一张地图开始
                'position_x' => 100,
                'position_y' => 100,
            ]);
            
            $user->characters()->save($character);
            
            return response()->json([
                'success' => true,
                'character' => $character,
                'gold' => $user->gold ?? 0,
                'message' => '已为您创建新角色'
            ]);
        }

        return response()->json([
            'success' => true,
            'character' => $character,
            'gold' => $user->gold ?? 0
        ]);
    }

    /**
     * 移动角色
     */
    public function moveCharacter(Request $request)
    {
        $request->validate([
            'x' => 'required|numeric',
            'y' => 'required|numeric',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        $character->position_x = $request->x;
        $character->position_y = $request->y;
        $character->save();

        // 广播角色移动事件
        event(new GameEvent('character.move', [
            'character' => [
                'id' => $character->id,
                'name' => $character->name,
                'level' => $character->level,
                'position_x' => $character->position_x,
                'position_y' => $character->position_y
            ]
        ], $character->current_map_id));

        return response()->json([
            'success' => true,
            'character' => $character
        ]);
    }

    /**
     * 获取地图数据，包括怪物、商店和其他玩家
     */
    public function getMap($mapId)
    {
        try {
            // 获取地图基本信息
            $map = Map::find($mapId);
            if (!$map) {
                return response()->json([
                    'success' => false,
                    'message' => '地图不存在',
                ], 404);
            }
            
            // 处理传送点数据
            if (is_string($map->teleport_points)) {
                $map->teleport_points = json_decode($map->teleport_points, true);
            }
            
            if (is_null($map->teleport_points)) {
                $map->teleport_points = [];
            }

            // 获取当前角色
            $user = Auth::user();
            $character = Character::where('user_id', $user->id)->first();
            if (!$character) {
                return response()->json([
                    'success' => false,
                    'message' => '角色不存在',
                ], 400);
            }
            
            // 更新角色当前地图
            $character->current_map_id = $mapId;
            $character->save();
            
            // 获取地图上的怪物
            $monsters = Monster::where('map_id', $mapId)->get();
            
            // 获取地图上的商店
            $shops = Shop::where('map_id', $mapId)->get();
            
            // 获取同一地图上的其他玩家
            $otherPlayers = Character::where('current_map_id', $mapId)
                ->where('id', '!=', $character->id)
                ->where('updated_at', '>', now()->subMinutes(5)) // 只获取5分钟内活跃的角色
                ->select('id', 'name', 'level', 'position_x', 'position_y')
                ->get();

            // 记录调试信息
            \Log::info('地图数据请求', [
                'map_id' => $mapId,
                'character_id' => $character->id,
                'other_players_count' => $otherPlayers->count(),
                'monsters_count' => $monsters->count(),
                'shops_count' => $shops->count()
            ]);
            
            // 返回完整地图数据
            return response()->json([
                'success' => true,
                'map' => $map,
                'character' => $character,
                'monsters' => $monsters,
                'shops' => $shops,
                'other_players' => $otherPlayers
            ]);
        } catch (\Exception $e) {
            \Log::error('获取地图数据异常: ' . $e->getMessage(), [
                'map_id' => $mapId,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => '获取地图数据失败: ' . $e,
            ], 500);
        }
    }

    /**
     * 更改地图
     */
    public function changeMap(Request $request)
    {
        $request->validate([
            'map_id' => 'required|exists:maps,id',
            'target_x' => 'nullable|numeric',
            'target_y' => 'nullable|numeric',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        $oldMapId = $character->current_map_id;
        
        // 设置角色在新地图的初始位置
        $map = Map::find($request->map_id);
        
        if ($request->has('target_x') && $request->has('target_y')) {
            // 如果请求中指定了目标位置，则使用指定位置
            $character->position_x = $request->target_x;
            $character->position_y = $request->target_y;
        } else {
            // 否则使用地图的默认出生点
            $spawnPoints = $map->spawn_points;
            if (is_array($spawnPoints) && count($spawnPoints) > 0) {
                // 随机选择一个出生点
                $spawnPoint = $spawnPoints[array_rand($spawnPoints)];
                $character->position_x = $spawnPoint['x'];
                $character->position_y = $spawnPoint['y'];
            } else {
                // 如果没有出生点，则使用默认位置
                $character->position_x = 100;
                $character->position_y = 100;
            }
        }

        // 广播角色离开旧地图事件
        event(new GameEvent('character.leave', [
            'character_id' => $character->id,
            'character' => [
                'id' => $character->id,
                'name' => $character->name,
                'level' => $character->level,
                'position_x' => $character->position_x,
                'position_y' => $character->position_y
            ]
        ], $oldMapId));

        // 更新角色当前地图
        $character->current_map_id = $request->map_id;
        $character->save();

        // 广播角色进入新地图事件
        event(new GameEvent('character.enter', [
            'character_id' => $character->id,
            'character' => [
                'id' => $character->id,
                'name' => $character->name,
                'level' => $character->level,
                'position_x' => $character->position_x,
                'position_y' => $character->position_y
            ]
        ], $character->current_map_id));

        // 返回更新后的角色和地图数据
        return response()->json([
            'success' => true,
            'character' => $character,
            'map' => $map
        ]);
    }

    /**
     * 攻击怪物
     */
    public function attackMonster(Request $request)
    {
        $request->validate([
            'monster_id' => 'required|exists:monsters,id',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        $monster = Monster::find($request->monster_id);
        
        // 检查怪物是否在同一地图
        if ($monster->map_id != $character->current_map_id) {
            return response()->json([
                'success' => false,
                'message' => '怪物不在当前地图'
            ], 400);
        }

        // 计算角色对怪物的伤害
        $damage = rand($character->getAttackMinAttribute(), $character->getAttackMaxAttribute());
        $monster->current_hp -= $damage;

        // 确保怪物生命值不会小于0
        if ($monster->current_hp < 0) {
            $monster->current_hp = 0;
        }

        $result = [
            'success' => true,
            'damage' => $damage,
            'monster' => $monster,
        ];
        
        // 怪物反击（如果怪物没有死亡）
        if ($monster->current_hp > 0) {
            // 计算怪物对角色的伤害
            $monsterDamage = max(1, round($monster->attack * (1 - $character->defense / 100)));
            $character->current_hp -= $monsterDamage;
            
            // 确保角色生命值不会小于0
            if ($character->current_hp < 0) {
                $character->current_hp = 0;
            }
            
            $character->save();
            
            // 添加怪物反击信息到结果
            $result['monster_damage'] = $monsterDamage;
            $result['character'] = $character;
            
            // 检查角色是否死亡
            if ($character->current_hp <= 0) {
                $result['character_died'] = true;
                
                // 角色死亡处理（可以在这里添加复活逻辑）
                // 例如：将角色传送回新手村，恢复一定生命值等
                $character->current_hp = max(1, round($character->max_hp * 0.1)); // 恢复10%生命值
                $character->current_map_id = 1; // 传送回新手村
                $character->position_x = 100;
                $character->position_y = 100;
                $character->save();
                
                $result['character'] = $character;
                $result['respawn_message'] = '您已被击败，已传送回新手村并恢复少量生命值';
            }
        }

        // 检查怪物是否死亡
        if ($monster->current_hp <= 0) {
            $monster->current_hp = 0;
            $monster->save();
            
            // 计算获得的经验和金币
            $expGained = $monster->exp_reward;
            $goldGained = $monster->gold_reward;
            
            $character->exp += $expGained;
            $user->gold += $goldGained;
            $user->save();
            
            // 检查是否升级
            $leveledUp = false;
            while ($character->exp >= $character->getExpToLevelAttribute()) {
                $character->level += 1;
                $character->exp -= $character->getExpToLevelAttribute();
                $character->max_hp += 10;
                $character->current_hp = $character->max_hp;
                $character->attack += 2;
                $leveledUp = true;
            }
            
            $character->save();
            
            $result['monster_killed'] = true;
            $result['exp_gained'] = $expGained;
            $result['gold_gained'] = $goldGained;
            $result['character'] = $character;
            
            if ($leveledUp) {
                $result['leveled_up'] = true;
                $result['new_level'] = $character->level;
            }
            
            // 广播怪物死亡事件
            event(new GameEvent('monster.killed', [
                'monster_id' => $monster->id,
                'monster_name' => $monster->name,
                'killer_id' => $character->id,
                'killer_name' => $character->name
            ], $character->current_map_id));
            
            // 怪物重生逻辑
            // 设置一个临时标记，表示怪物已死亡，前端可以根据这个标记隐藏怪物
            $monster->is_dead = true;
            $monster->save();
            
            // 使用队列延迟执行怪物重生
            // 这里我们使用简单的方式，通过广播一个事件通知前端怪物重生
            $respawnTime = $monster->respawn_time ?? 60; // 默认60秒重生
            
            // 广播怪物即将重生的消息
            event(new GameEvent('monster.respawning', [
                'monster_id' => $monster->id,
                'monster_name' => $monster->name,
                'respawn_time' => $respawnTime
            ], $character->current_map_id));
            
            // 使用队列延迟执行怪物重生
            dispatch(function() use ($monster, $character) {
                // 重置怪物生命值
                $monster->current_hp = $monster->hp;
                $monster->is_dead = false;
                $monster->save();
                
                // 广播怪物重生事件
                event(new GameEvent('monster.respawned', [
                    'monster_id' => $monster->id,
                    'monster_name' => $monster->name,
                    'hp' => $monster->hp,
                    'current_hp' => $monster->current_hp,
                    'hp_percentage' => 100, // 重生时血量为满
                    'position_x' => $monster->position_x,
                    'position_y' => $monster->position_y,
                    'is_dead' => false
                ], $monster->map_id));
            })->delay(now()->addSeconds($respawnTime));
        } else {
            $monster->save();
            
            // 广播怪物受伤事件
            broadcast(new GameEvent('monster.damaged', [
                'monster_id' => $monster->id,
                'monster_name' => $monster->name,
                'attacker_id' => $character->id,
                'attacker_name' => $character->name,
                'damage' => $damage,
                'current_hp' => $monster->current_hp,
                'hp_percentage' => ($monster->current_hp / $monster->hp) * 100,
                'is_dead' => false
            ]));
        }
        
        // 重新获取最新的怪物信息
        $monster = Monster::find($monster->id);
        
        // 确保返回的怪物数据包含hp_percentage
        $monster->hp_percentage = ($monster->current_hp / $monster->hp) * 100;
        
        $result['monster'] = $monster;
        
        return response()->json($result);
    }

    /**
     * 管理地图传送点
     */
    public function manageTeleportPoints(Request $request)
    {
        $request->validate([
            'action' => 'required|string|in:add,remove,create_bidirectional',
            'map_id' => 'required|exists:maps,id',
            'x' => 'required|numeric',
            'y' => 'required|numeric',
            'target_map_id' => 'required_unless:action,remove|exists:maps,id',
            'target_x' => 'required_unless:action,remove|numeric',
            'target_y' => 'required_unless:action,remove|numeric',
        ]);

        $map = Map::find($request->map_id);
        
        if (!$map) {
            return response()->json([
                'success' => false,
                'message' => '地图不存在'
            ], 404);
        }

        $result = false;
        $message = '';

        switch ($request->action) {
            case 'add':
                $result = $map->addTeleportPoint(
                    $request->x, 
                    $request->y, 
                    $request->target_map_id, 
                    $request->target_x, 
                    $request->target_y
                );
                $message = $result ? '成功添加传送点' : '添加传送点失败';
                break;
                
            case 'remove':
                $result = $map->removeTeleportPoint($request->x, $request->y);
                $message = $result ? '成功移除传送点' : '移除传送点失败';
                break;
                
            case 'create_bidirectional':
                $targetMap = Map::find($request->target_map_id);
                if (!$targetMap) {
                    return response()->json([
                        'success' => false,
                        'message' => '目标地图不存在'
                    ], 404);
                }
                
                $result = $map->createBidirectionalTeleport(
                    $targetMap,
                    $request->x,
                    $request->y,
                    $request->target_x,
                    $request->target_y
                );
                $message = $result ? '成功创建双向传送点' : '创建双向传送点失败';
                break;
        }

        // 广播地图更新事件
        if ($result) {
            event(new GameEvent('map.updated', [
                'map_id' => $map->id,
                'message' => $message
            ]));
            
            // 如果是双向传送点，也广播目标地图的更新
            if ($request->action === 'create_bidirectional') {
                event(new GameEvent('map.updated', [
                    'map_id' => $request->target_map_id,
                    'message' => '地图传送点已更新'
                ]));
            }
        }

        return response()->json([
            'success' => $result,
            'message' => $message,
            'map' => $map
        ]);
    }
    
    /**
     * 获取所有地图信息
     */
    public function getAllMaps()
    {
        $maps = Map::all();
        
        // 确保每个地图的teleport_points是数组
        $maps->each(function($map) {
            // 如果teleport_points是字符串，则解析为数组
            if (is_string($map->teleport_points)) {
                $map->teleport_points = json_decode($map->teleport_points, true);
            }
            
            // 如果teleport_points为null，则设置为空数组
            if ($map->teleport_points === null) {
                $map->teleport_points = [];
            }
        });
        
        return response()->json([
            'success' => true,
            'maps' => $maps
        ]);
    }

    /**
     * 处理角色进入地图事件
     */
    public function enterMap(Request $request)
    {
        try {
            $mapId = $request->input('map_id');
            if (!$mapId) {
                return response()->json([
                    'success' => false,
                    'message' => '地图ID不能为空'
                ], 400);
            }
            
            $character = Character::where('user_id', Auth::id())->first();
            if (!$character) {
                return response()->json([
                    'success' => false,
                    'message' => '角色不存在'
                ], 400);
            }
            
            // 更新角色当前地图
            $character->current_map_id = $mapId;
            $character->save();
            
            // 广播角色进入地图事件
            event(new GameEvent('character.enter', [
                'character' => [
                    'id' => $character->id,
                    'name' => $character->name,
                    'level' => $character->level,
                    'position_x' => $character->position_x,
                    'position_y' => $character->position_y
                ]
            ], $mapId));
            
            return response()->json([
                'success' => true,
                'message' => '角色进入地图事件已广播'
            ]);
        } catch (\Exception $e) {
            \Log::error('处理角色进入地图事件失败: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => '处理角色进入地图事件失败: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 创建地图传送点
     */
    public function createTeleportPoint(Request $request)
    {
        try {
            // 验证管理员权限
            $user = Auth::user();
            if (!$user->is_admin) {
                return response()->json([
                    'success' => false,
                    'message' => '无权执行此操作'
                ], 403);
            }
            
            // 验证请求数据
            $validated = $request->validate([
                'map_id' => 'required|exists:maps,id',
                'target_map_id' => 'required|exists:maps,id',
                'position_x' => 'required|numeric',
                'position_y' => 'required|numeric',
                'target_position_x' => 'required|numeric',
                'target_position_y' => 'required|numeric',
                'name' => 'required|string|max:50',
            ]);
            
            // 获取地图
            $map = Map::find($validated['map_id']);
            
            // 处理现有传送点
            $teleportPoints = [];
            if ($map->teleport_points) {
                if (is_string($map->teleport_points)) {
                    $teleportPoints = json_decode($map->teleport_points, true) ?? [];
                } else {
                    $teleportPoints = $map->teleport_points;
                }
            }
            
            // 创建新传送点数据
            $newTeleportPoint = [
                'id' => count($teleportPoints) + 1,
                'name' => $validated['name'],
                'position_x' => (int)$validated['position_x'],
                'position_y' => (int)$validated['position_y'],
                'target_map_id' => (int)$validated['target_map_id'],
                'target_position_x' => (int)$validated['target_position_x'],
                'target_position_y' => (int)$validated['target_position_y'],
            ];
            
            // 添加到传送点数组
            $teleportPoints[] = $newTeleportPoint;
            
            // 更新地图传送点
            $map->teleport_points = json_encode($teleportPoints);
            $map->save();
            
            return response()->json([
                'success' => true,
                'message' => '传送点创建成功',
                'teleport_point' => $newTeleportPoint,
                'all_teleport_points' => $teleportPoints
            ]);
        } catch (\Exception $e) {
            \Log::error('创建传送点失败: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => '创建传送点失败: ' . $e->getMessage()
            ], 500);
        }
    }
} 