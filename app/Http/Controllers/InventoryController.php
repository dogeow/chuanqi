<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\Inventory;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            // 应用物品效果
            $effects = json_decode($item->effects, true);

            if (isset($effects['hp'])) {
                $character->current_hp = min($character->max_hp, $character->current_hp + $effects['hp']);
                $message .= '，恢复了' . $effects['hp'] . '点生命值';
            }

            if (isset($effects['mp'])) {
                $character->current_mp = min($character->max_mp, $character->current_mp + $effects['mp']);
                $message .= '，恢复了' . $effects['mp'] . '点魔法值';
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

        // 检查物品是否可装备
        if ($item->type != 'equipment') {
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
                $query->where('equipment_type', $item->equipment_type);
            })
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
        $character->attack_min = $character->base_attack_min;
        $character->attack_max = $character->base_attack_max;
        $character->defense = $character->base_defense;
        $character->max_hp = $character->base_max_hp;
        $character->max_mp = $character->base_max_mp;

        // 获取所有已装备的物品
        $is_equippedItems = Inventory::where('character_id', $character->id)
            ->where('is_equipped', true)
            ->with('item')
            ->get();

        // 应用装备属性加成
        foreach ($is_equippedItems as $is_equippedItem) {
            $effects = json_decode($is_equippedItem->item->effects, true);
            
            if (isset($effects['attack_min'])) {
                $character->attack_min += $effects['attack_min'];
            }
            
            if (isset($effects['attack_max'])) {
                $character->attack_max += $effects['attack_max'];
            }
            
            if (isset($effects['defense'])) {
                $character->defense += $effects['defense'];
            }
            
            if (isset($effects['max_hp'])) {
                $character->max_hp += $effects['max_hp'];
            }
            
            if (isset($effects['max_mp'])) {
                $character->max_mp += $effects['max_mp'];
            }
        }

        // 确保当前生命值和魔法值不超过最大值
        $character->current_hp = min($character->current_hp, $character->max_hp);
        $character->current_mp = min($character->current_mp, $character->max_mp);
        
        $character->save();
    }
}
