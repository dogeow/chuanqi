<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\Map;
use App\Models\Monster;
use App\Models\Shop;
use Illuminate\Http\Request;
use App\Services\CombatService;
use Illuminate\Support\Facades\Auth;
use App\Services\ItemDropService;

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
                'gold' => 0,
                'level' => 1,
                'exp' => 0,
                'max_hp' => 30,
                'current_hp' => 30,
                'max_mp' => 0,
                'current_mp' => 0,
                'attack' => 10,
                'defense' => 10,
                'current_map_id' => 1, // 默认从第一张地图开始
                'position_x' => 150,
                'position_y' => 150,
            ]);
            
            $user->character()->save($character);
            
            return response()->json([
                'success' => true,
                'character' => $character,
                'message' => '已为您创建新角色'
            ]);
        }

        return response()->json([
            'success' => true,
            'character' => $character,
        ]);
    }

    /**
     * 移动角色
     */
    public function moveCharacter(Request $request)
    {
        $request->validate([
            'position_x' => 'required|numeric',
            'position_y' => 'required|numeric',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 记录原始位置用于日志
        $oldX = $character->position_x;
        $oldY = $character->position_y;
        
        // 更新角色位置
        $character->position_x = $request->position_x;
        $character->position_y = $request->position_y;
        $character->save();

        // 记录位置变更日志
        \Log::info('角色移动', [
            'character_id' => $character->id,
            'name' => $character->name,
            'from' => ['x' => $oldX, 'y' => $oldY],
            'to' => ['x' => $character->position_x, 'y' => $character->position_y]
        ]);

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
                ->get();
            
            // 返回完整地图数据
            return response()->json([
                'success' => true,
                'map' => $map,
                'character' => $character,
                'monsters' => $monsters,
                'shops' => $shops,
                'other_players' => $otherPlayers,
                'teleport_points' => $map->teleport_points,
                'npcs' => [], // 暂时返回空数组
                'map_markers' => [] // 暂时返回空数组
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
            'from_map_id' => 'nullable|numeric',
            'from_teleport_x' => 'nullable|numeric',
            'from_teleport_y' => 'nullable|numeric',
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
            // 查找目标地图中是否有对应的传送点（从当前地图指向的传送点）
            $foundTargetTeleport = false;
            
            if ($request->has('from_map_id') && $request->has('from_teleport_x') && $request->has('from_teleport_y')) {
                $teleportPoints = $map->teleport_points;
                
                // 确保传送点数据是数组
                if (is_string($teleportPoints)) {
                    $teleportPoints = json_decode($teleportPoints, true);
                }
                
                if (is_array($teleportPoints)) {
                    // 查找指向来源地图的传送点
                    foreach ($teleportPoints as $teleport) {
                        if (isset($teleport['target_map_id']) && $teleport['target_map_id'] == $request->from_map_id) {
                            // 找到了对应的传送点，将角色放在传送点附近
                            $character->position_x = $teleport['x'];
                            $character->position_y = $teleport['y'];
                            $foundTargetTeleport = true;
                            break;
                        }
                    }
                }
            }
            
            // 如果没有找到对应的传送点，则使用地图的默认出生点
            if (!$foundTargetTeleport) {
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

        // 检查与怪物的距离
        $dx = $character->position_x - $monster->position_x;
        $dy = $character->position_y - $monster->position_y;
        $distance = sqrt($dx * $dx + $dy * $dy);

        if ($distance > 120) {
            return response()->json([
                'success' => false,
                'message' => '距离太远，无法攻击'
            ], 400);
        }

        // 使用战斗服务处理攻击逻辑
        $combatService = new CombatService();
        $result = $combatService->characterAttackMonster($character, $monster);
        
        return response()->json($result);
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
     * 处理角色传送到其他地图
     */
    public function teleportCharacter(Request $request)
    {
        $request->validate([
            'map_id' => 'required|exists:maps,id',
            'position_x' => 'nullable|numeric',
            'position_y' => 'nullable|numeric',
            'from_map_id' => 'nullable|numeric',
            'from_teleport_x' => 'nullable|numeric',
            'from_teleport_y' => 'nullable|numeric',
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
        
        // 获取目标地图信息
        $targetMap = Map::find($request->map_id);
        if (!$targetMap) {
            return response()->json([
                'success' => false,
                'message' => '目标地图不存在'
            ], 404);
        }
        
        // 设置角色在新地图的位置
        if ($request->has('position_x') && $request->has('position_y')) {
            // 如果请求中指定了目标位置，则使用指定位置
            $character->position_x = $request->position_x;
            $character->position_y = $request->position_y;
        } else {
            // 查找目标地图中是否有对应的传送点（从当前地图指向的传送点）
            $foundTargetTeleport = false;
            
            if ($request->has('from_map_id') && $request->has('from_teleport_x') && $request->has('from_teleport_y')) {
                $teleportPoints = $targetMap->teleport_points;
                
                // 确保传送点数据是数组
                if (is_string($teleportPoints)) {
                    $teleportPoints = json_decode($teleportPoints, true);
                }
                
                if (is_array($teleportPoints)) {
                    // 查找指向来源地图的传送点
                    foreach ($teleportPoints as $teleport) {
                        if (isset($teleport['target_map_id']) && $teleport['target_map_id'] == $request->from_map_id) {
                            // 找到了对应的传送点，将角色放在传送点附近
                            $character->position_x = $teleport['x'];
                            $character->position_y = $teleport['y'];
                            $foundTargetTeleport = true;
                            break;
                        }
                    }
                }
            }
            
            // 如果没有找到对应的传送点，则使用地图的默认出生点
            if (!$foundTargetTeleport) {
                $spawnPoints = $targetMap->spawn_points;
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
        }
        
        // 记录传送日志
        \Log::info('角色传送', [
            'character_id' => $character->id,
            'name' => $character->name,
            'from_map' => $oldMapId,
            'to_map' => $request->map_id,
            'position_x' => $character->position_x,
            'position_y' => $character->position_y
        ]);
        
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

        // 更新角色位置和地图
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

        // 处理传送点数据
        if (is_string($targetMap->teleport_points)) {
            $targetMap->teleport_points = json_decode($targetMap->teleport_points, true);
        }
        
        if (is_null($targetMap->teleport_points)) {
            $targetMap->teleport_points = [];
        }

        // 返回更新后的角色和地图数据
        return response()->json([
            'success' => true,
            'character' => $character,
            'map' => $targetMap,
            'map_name' => $targetMap->name,
            'position_x' => $character->position_x,
            'position_y' => $character->position_y,
            'teleport_points' => $targetMap->teleport_points
        ]);
    }
} 