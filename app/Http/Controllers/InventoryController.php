<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\CharacterItem;
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
        $inventory = CharacterItem::where('character_id', $character->id)
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
            'character_item_id' => 'required|exists:character_items,id',
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
        $characterItem = CharacterItem::where('id', $request->character_item_id)
            ->where('character_id', $character->id)
            ->with('item')
            ->first();

        if (!$characterItem) {
            return response()->json([
                'success' => false,
                'message' => '物品不存在或不属于该角色'
            ], 404);
        }

        $item = $characterItem->item;

        // 检查物品是否可使用
        if ($item->type != 'consumable') {
            return response()->json([
                'success' => false,
                'message' => '该物品不可使用'
            ], 400);
        }

        // 应用物品效果
        $effects = json_decode($item->effects, true);
        $message = '使用了' . $item->name;

        if (isset($effects['hp'])) {
            $character->current_hp = min($character->max_hp, $character->current_hp + $effects['hp']);
            $message .= '，恢复了' . $effects['hp'] . '点生命值';
        }

        if (isset($effects['mp'])) {
            $character->current_mp = min($character->max_mp, $character->current_mp + $effects['mp']);
            $message .= '，恢复了' . $effects['mp'] . '点魔法值';
        }

        // 更新角色状态
        $character->save();

        // 减少物品数量
        $characterItem->quantity -= 1;
        if ($characterItem->quantity <= 0) {
            $characterItem->delete();
        } else {
            $characterItem->save();
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
            'inventory' => CharacterItem::where('character_id', $character->id)->with('item')->get()
        ]);
    }

    /**
     * 装备物品
     */
    public function equipItem(Request $request)
    {
        $request->validate([
            'character_item_id' => 'required|exists:character_items,id',
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
        $characterItem = CharacterItem::where('id', $request->character_item_id)
            ->where('character_id', $character->id)
            ->with('item')
            ->first();

        if (!$characterItem) {
            return response()->json([
                'success' => false,
                'message' => '物品不存在或不属于该角色'
            ], 404);
        }

        $item = $characterItem->item;

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
        $equippedItem = CharacterItem::where('character_id', $character->id)
            ->where('equipped', true)
            ->whereHas('item', function ($query) use ($item) {
                $query->where('equipment_type', $item->equipment_type);
            })
            ->first();

        if ($equippedItem) {
            // 卸下已装备的物品
            $equippedItem->equipped = false;
            $equippedItem->save();
        }

        // 装备新物品
        $characterItem->equipped = true;
        $characterItem->save();

        // 更新角色属性
        $this->updateCharacterStats($character);

        // 广播装备物品事件
        event(new GameEvent('item.equipped', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'item_id' => $item->id,
            'item_name' => $item->name
        ], $character->map_id));

        return response()->json([
            'success' => true,
            'message' => '成功装备' . $item->name,
            'character' => $character,
            'inventory' => CharacterItem::where('character_id', $character->id)->with('item')->get()
        ]);
    }

    /**
     * 卸下物品
     */
    public function unequipItem(Request $request)
    {
        $request->validate([
            'character_item_id' => 'required|exists:character_items,id',
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
        $characterItem = CharacterItem::where('id', $request->character_item_id)
            ->where('character_id', $character->id)
            ->where('equipped', true)
            ->with('item')
            ->first();

        if (!$characterItem) {
            return response()->json([
                'success' => false,
                'message' => '物品不存在、不属于该角色或未装备'
            ], 404);
        }

        // 卸下物品
        $characterItem->equipped = false;
        $characterItem->save();

        // 更新角色属性
        $this->updateCharacterStats($character);

        // 广播卸下物品事件
        event(new GameEvent('item.unequipped', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'item_id' => $characterItem->item->id,
            'item_name' => $characterItem->item->name
        ], $character->map_id));

        return response()->json([
            'success' => true,
            'message' => '成功卸下' . $characterItem->item->name,
            'character' => $character,
            'inventory' => CharacterItem::where('character_id', $character->id)->with('item')->get()
        ]);
    }

    /**
     * 丢弃物品
     */
    public function dropItem(Request $request)
    {
        $request->validate([
            'character_item_id' => 'required|exists:character_items,id',
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
        $characterItem = CharacterItem::where('id', $request->character_item_id)
            ->where('character_id', $character->id)
            ->with('item')
            ->first();

        if (!$characterItem) {
            return response()->json([
                'success' => false,
                'message' => '物品不存在或不属于该角色'
            ], 404);
        }

        // 检查物品是否已装备
        if ($characterItem->equipped) {
            return response()->json([
                'success' => false,
                'message' => '已装备的物品不能丢弃，请先卸下'
            ], 400);
        }

        // 检查数量是否合法
        if ($request->quantity > $characterItem->quantity) {
            return response()->json([
                'success' => false,
                'message' => '丢弃数量超过拥有数量'
            ], 400);
        }

        // 减少物品数量
        $characterItem->quantity -= $request->quantity;
        if ($characterItem->quantity <= 0) {
            $characterItem->delete();
        } else {
            $characterItem->save();
        }

        // 广播丢弃物品事件
        event(new GameEvent('item.dropped', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'item_id' => $characterItem->item->id,
            'item_name' => $characterItem->item->name,
            'quantity' => $request->quantity
        ], $character->map_id));

        return response()->json([
            'success' => true,
            'message' => '成功丢弃' . $request->quantity . '个' . $characterItem->item->name,
            'inventory' => CharacterItem::where('character_id', $character->id)->with('item')->get()
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
        $equippedItems = CharacterItem::where('character_id', $character->id)
            ->where('equipped', true)
            ->with('item')
            ->get();

        // 应用装备属性加成
        foreach ($equippedItems as $equippedItem) {
            $effects = json_decode($equippedItem->item->effects, true);
            
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
