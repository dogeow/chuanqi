<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Inventory;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\GameEvent;

class ItemController extends Controller
{
    public function useItem(Request $request)
    {
        $request->validate([
            'inventory_item_id' => 'required|exists:inventory,id',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        $inventoryItem = Inventory::where('id', $request->inventory_item_id)
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

        // 检查物品是否可使用
        if (!$item->is_usable) {
            return response()->json([
                'success' => false,
                'message' => '该物品不可使用'
            ], 400);
        }

        // 根据物品类型执行不同效果
        $message = '';
        $oldHp = $character->current_hp;
        $oldMp = $character->current_mp;
        
        switch ($item->type) {
            case 'potion':
                // 恢复生命值
                if ($item->hp_restore > 0) {
                    $character->current_hp = min($character->max_hp, $character->current_hp + $item->hp_restore);
                    $message .= "恢复了 {$item->hp_restore} 点生命值。";
                }
                
                // 恢复魔法值
                if ($item->mp_restore > 0) {
                    $character->current_mp = min($character->max_mp, $character->current_mp + $item->mp_restore);
                    $message .= "恢复了 {$item->mp_restore} 点魔法值。";
                }
                
                // 如果生命值或魔法值有变化，广播事件
                if ($oldHp != $character->current_hp) {
                    // 广播角色治疗事件
                    event(new GameEvent('character.healed', [
                        'character_id' => $character->id,
                        'character_name' => $character->name,
                        'heal_amount' => $character->current_hp - $oldHp,
                        'current_hp' => $character->current_hp,
                        'max_hp' => $character->max_hp,
                        'hp_percentage' => ($character->current_hp / $character->max_hp) * 100,
                        'item_used' => $item->name,
                        'is_heal' => true
                    ], $character->current_map_id));
                }
                
                break;
                
            // 其他物品类型处理...
            
            default:
                return response()->json([
                    'success' => false,
                    'message' => '未知的物品类型'
                ], 400);
        }

        // 减少物品数量
        $inventoryItem->quantity -= 1;
        
        if ($inventoryItem->quantity <= 0) {
            // 如果物品用完了，从背包中移除
            $inventoryItem->delete();
        } else {
            $inventoryItem->save();
        }
        
        $character->save();

        return response()->json([
            'success' => true,
            'message' => "使用了 {$item->name}。" . $message,
            'character' => $character,
            'inventory' => Inventory::where('character_id', $character->id)->with('item')->get()
        ]);
    }
} 