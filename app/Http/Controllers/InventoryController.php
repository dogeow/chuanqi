<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\Inventory;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    /**
     * 获取角色背包物品
     */
    public function getInventory()
    {
        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 获取角色背包物品
        $inventory = Inventory::where('character_id', $character->id)
            ->with('item')
            ->get();

        return response()->json([
            'success' => true,
            'inventory' => $inventory
        ]);
    }

    /**
     * 使用物品
     */
    public function useItem(Request $request)
    {
        $request->validate([
            'character_item_id' => 'required|exists:inventories,id',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 检查物品是否属于该角色
        $inventoryItem = Inventory::where('id', $request->character_item_id)
            ->where('character_id', $character->id)
            ->with('item')
            ->first();

        if (!$inventoryItem) {
            return response()->json([
                'success' => false,
                'message' => '物品不存在或不属于该角色'
            ], 404);
        }

        $item = $inventoryItem->item;
        $message = '使用了' . $item->name;

        // 根据物品类型应用不同效果
        if ($item->type == 'skill_book') {
            // 技能书逻辑
            $skillId = $item->skill_id;
            
            // 检查角色是否已学习该技能
            $existingSkill = \App\Models\CharacterSkill::where('character_id', $character->id)
                ->where('skill_id', $skillId)
                ->first();
                
            if ($existingSkill) {
                return response()->json([
                    'success' => false,
                    'message' => '已经学习了该技能'
                ], 400);
            }
            
            // 获取技能信息
            $skill = \App\Models\Skill::find($skillId);
            
            // 检查角色等级是否满足要求
            if ($character->level < $skill->level_required) {
                return response()->json([
                    'success' => false,
                    'message' => '角色等级不足，无法学习该技能'
                ], 400);
            }
            
            // 学习技能
            $characterSkill = new \App\Models\CharacterSkill();
            $characterSkill->character_id = $character->id;
            $characterSkill->skill_id = $skillId;
            $characterSkill->level = 1;
            $characterSkill->save();
            
            $message .= '，学会了技能：' . $skill->name;
        } else {
            if (isset($item->hp_bonus)) {
                $character->current_hp = min($character->max_hp, $character->current_hp + $item->hp_bonus);
                $message .= '，恢复了' . $item->hp_bonus . '点生命值';
            }

            if (isset($item->hp_bonus)) {
                $character->current_mp = min($character->max_mp, $character->current_mp + $item->hp_bonus);
                $message .= '，恢复了' . $item->hp_bonus . '点魔法值';
            }
        }

        // 更新角色状态
        $character->save();

        // 减少物品数量
        $inventoryItem->quantity -= 1;
        if ($inventoryItem->quantity <= 0) {
            $inventoryItem->delete();
        } else {
            $inventoryItem->save();
        }

        // 广播使用物品事件
        event(new GameEvent('item.used', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'item_id' => $item->id,
            'item_name' => $item->name,
            'message' => $message
        ], $character->map_id));

        return response()->json([
            'success' => true,
            'message' => $message,
            'character' => $character,
            'inventory' => Inventory::where('character_id', $character->id)->with('item')->get()
        ]);
    }

    /**
     * 装备物品
     */
    public function equipItem(Request $request)
    {
        $request->validate([
            'character_item_id' => 'required|exists:inventories,id',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 使用数据库事务
        return \DB::transaction(function() use ($request, $character) {
            // 检查物品是否属于该角色
            $inventoryItem = Inventory::where('id', $request->character_item_id)
                ->where('character_id', $character->id)
                ->with('item')
                ->lockForUpdate()
                ->first();

            if (!$inventoryItem) {
                return response()->json([
                    'success' => false,
                    'message' => '物品不存在或不属于该角色'
                ], 404);
            }

            $item = $inventoryItem->item;

            // 检查物品是否可装备
            if ($item->is_equippable != '1') {
                return response()->json([
                    'success' => false,
                    'message' => '该物品不可装备'
                ], 400);
            }

            // 检查角色等级是否满足要求
            if ($character->level < $item->level_required) {
                return response()->json([
                    'success' => false,
                    'message' => '角色等级不足，无法装备该物品'
                ], 400);
            }

            // 检查是否已经装备了同类型的物品
            $is_equippedItem = Inventory::where('character_id', $character->id)
                ->where('is_equipped', true)
                ->whereHas('item', function ($query) use ($item) {
                    $query->where('type', $item->type);
                })
                ->lockForUpdate()
                ->first();

            if ($is_equippedItem) {
                // 卸下已装备的物品
                $is_equippedItem->is_equipped = false;
                $is_equippedItem->save();
            }

            // 装备新物品
            $inventoryItem->is_equipped = true;
            $inventoryItem->save();

            // 更新角色属性
            $this->updateCharacterStats($character);

            // 广播装备物品事件
            event(new GameEvent('item.is_equipped', [
                'character_id' => $character->id,
                'character_name' => $character->name,
                'item_id' => $item->id,
                'item_name' => $item->name
            ], $character->map_id));

            return response()->json([
                'success' => true,
                'message' => '成功装备' . $item->name,
                'character' => $character,
                'inventory' => Inventory::where('character_id', $character->id)->with('item')->get()
            ]);
        });
    }

    /**
     * 卸下物品
     */
    public function unequipItem(Request $request)
    {
        $request->validate([
            'character_item_id' => 'required|exists:inventories,id',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 检查物品是否属于该角色
        $inventoryItem = Inventory::where('id', $request->character_item_id)
            ->where('character_id', $character->id)
            ->where('is_equipped', true)
            ->with('item')
            ->first();

        if (!$inventoryItem) {
            return response()->json([
                'success' => false,
                'message' => '物品不存在、不属于该角色或未装备'
            ], 404);
        }

        // 卸下物品
        $inventoryItem->is_equipped = false;
        $inventoryItem->save();

        // 更新角色属性
        $this->updateCharacterStats($character);

        // 广播卸下物品事件
        event(new GameEvent('item.unis_equipped', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'item_id' => $inventoryItem->item->id,
            'item_name' => $inventoryItem->item->name
        ], $character->map_id));

        return response()->json([
            'success' => true,
            'message' => '成功卸下' . $inventoryItem->item->name,
            'character' => $character,
            'inventory' => Inventory::where('character_id', $character->id)->with('item')->get()
        ]);
    }

    /**
     * 丢弃物品
     */
    public function dropItem(Request $request)
    {
        $request->validate([
            'character_item_id' => 'required|exists:inventories,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 检查物品是否属于该角色
        $inventoryItem = Inventory::where('id', $request->character_item_id)
            ->where('character_id', $character->id)
            ->with('item')
            ->first();

        if (!$inventoryItem) {
            return response()->json([
                'success' => false,
                'message' => '物品不存在或不属于该角色'
            ], 404);
        }

        // 检查物品是否已装备
        if ($inventoryItem->is_equipped) {
            return response()->json([
                'success' => false,
                'message' => '已装备的物品不能丢弃，请先卸下'
            ], 400);
        }

        // 检查数量是否合法
        if ($request->quantity > $inventoryItem->quantity) {
            return response()->json([
                'success' => false,
                'message' => '丢弃数量超过拥有数量'
            ], 400);
        }

        // 减少物品数量
        $inventoryItem->quantity -= $request->quantity;
        if ($inventoryItem->quantity <= 0) {
            $inventoryItem->delete();
        } else {
            $inventoryItem->save();
        }

        // 广播丢弃物品事件
        event(new GameEvent('item.dropped', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'item_id' => $inventoryItem->item->id,
            'item_name' => $inventoryItem->item->name,
            'quantity' => $request->quantity
        ], $character->map_id));

        return response()->json([
            'success' => true,
            'message' => '成功丢弃' . $request->quantity . '个' . $inventoryItem->item->name,
            'inventory' => Inventory::where('character_id', $character->id)->with('item')->get()
        ]);
    }

    /**
     * 更新角色属性
     */
    private function updateCharacterStats(Character $character)
    {
        // 重置角色属性为基础值
        $character->attack = $character->base_attack;
        $character->defense = $character->base_defense;
        $character->max_hp = $character->base_hp;
        $character->max_mp = $character->base_mp;

        // 获取所有已装备的物品
        $is_equippedItems = Inventory::where('character_id', $character->id)
            ->where('is_equipped', true)
            ->with('item')
            ->get();

        // 应用装备属性加成
        foreach ($is_equippedItems as $is_equippedItem) {
            $character->attack += $is_equippedItem->item->attack_bonus;
            $character->defense += $is_equippedItem->item->defense_bonus;
            $character->max_hp += $is_equippedItem->item->hp_bonus;
            $character->max_mp += $is_equippedItem->item->mp_bonus;
        }

        // 确保当前生命值和魔法值不超过最大值
        $character->current_hp = min($character->current_hp, $character->max_hp);
        $character->current_mp = min($character->current_mp, $character->max_mp);
        
        Log::info('更新角色属性'.$character->defense);
        $character->save();
    }
}
