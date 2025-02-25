<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\Map;
use App\Models\Monster;
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
                'message' => '已为您创建新角色'
            ]);
        }

        return response()->json([
            'success' => true,
            'character' => $character
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
            'character_id' => $character->id,
            'x' => $character->position_x,
            'y' => $character->position_y,
            'name' => $character->name
        ], $character->current_map_id));

        return response()->json([
            'success' => true,
            'character' => $character
        ]);
    }

    /**
     * 获取地图信息
     */
    public function getMap(Request $request)
    {
        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        $map = Map::find($character->current_map_id);
        if (!$map) {
            return response()->json([
                'success' => false,
                'message' => '地图不存在'
            ], 404);
        }

        // 获取地图上的怪物
        $monsters = Monster::where('map_id', $map->id)->get();

        // 获取地图上的其他玩家
        $otherPlayers = Character::where('current_map_id', $map->id)
            ->where('id', '!=', $character->id)
            ->get(['id', 'name', 'position_x', 'position_y', 'level']);

        return response()->json([
            'success' => true,
            'map' => $map,
            'monsters' => $monsters,
            'otherPlayers' => $otherPlayers
        ]);
    }

    /**
     * 更改地图
     */
    public function changeMap(Request $request)
    {
        $request->validate([
            'map_id' => 'required|exists:maps,id',
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
        $character->current_map_id = $request->map_id;
        
        // 设置角色在新地图的初始位置
        $map = Map::find($request->map_id);
        $character->position_x = $map->spawn_x;
        $character->position_y = $map->spawn_y;
        $character->save();

        // 广播角色离开旧地图事件
        event(new GameEvent('character.leave', [
            'character_id' => $character->id,
            'name' => $character->name
        ], $oldMapId));

        // 广播角色进入新地图事件
        event(new GameEvent('character.enter', [
            'character_id' => $character->id,
            'x' => $character->position_x,
            'y' => $character->position_y,
            'name' => $character->name,
            'level' => $character->level
        ], $character->current_map_id));

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
        if ($monster->map_id != $character->map_id) {
            return response()->json([
                'success' => false,
                'message' => '怪物不在当前地图'
            ], 400);
        }

        // 计算伤害（简单示例）
        $damage = rand($character->attack_min, $character->attack_max);
        $monster->current_hp -= $damage;

        $result = [
            'success' => true,
            'damage' => $damage,
            'monster' => $monster,
        ];

        // 检查怪物是否死亡
        if ($monster->current_hp <= 0) {
            $monster->current_hp = 0;
            $monster->save();
            
            // 计算获得的经验和金币
            $expGained = $monster->exp_reward;
            $goldGained = $monster->gold_reward;
            
            $character->exp += $expGained;
            $character->gold += $goldGained;
            
            // 检查是否升级
            $leveledUp = false;
            while ($character->exp >= $character->exp_to_level) {
                $character->level += 1;
                $character->exp -= $character->exp_to_level;
                $character->exp_to_level = $character->level * 100; // 简单的升级公式
                $character->max_hp += 10;
                $character->current_hp = $character->max_hp;
                $character->attack_min += 2;
                $character->attack_max += 3;
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
            ], $character->map_id));
            
            // 怪物重生逻辑（可以通过队列延迟执行）
            // 这里简单处理，直接重置怪物生命值
            $monster->current_hp = $monster->max_hp;
            $monster->save();
        } else {
            $monster->save();
            
            // 广播怪物受伤事件
            event(new GameEvent('monster.damaged', [
                'monster_id' => $monster->id,
                'monster_name' => $monster->name,
                'damage' => $damage,
                'attacker_id' => $character->id,
                'attacker_name' => $character->name,
                'current_hp' => $monster->current_hp,
                'max_hp' => $monster->max_hp
            ], $character->map_id));
        }
        
        return response()->json($result);
    }
} 