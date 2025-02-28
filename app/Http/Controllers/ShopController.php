<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\Inventory;
use App\Models\Item;
use App\Models\Shop;
use App\Models\ShopItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ShopController extends Controller
{
    /**
     * 获取商店信息
     */
    public function getShop($shopId)
    {
        // 验证商店ID
        if (!$shopId || !is_numeric($shopId)) {
            return response()->json([
                'success' => false,
                'message' => '无效的商店ID'
            ], 400);
        }

        $user = Auth::user();
        $character = $user->character;

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        $shop = Shop::find($shopId);
        
        if (!$shop) {
            return response()->json([
                'success' => false,
                'message' => '商店不存在'
            ], 404);
        }
        
        // 获取商店物品，确保加载完整的物品信息
        $shopItems = ShopItem::where('shop_id', $shop->id)
            ->with(['item' => function($query) {
                $query->select('id', 'name', 'description', 'type', 'is_consumable');
            }])
            ->get()
            ->map(function($shopItem) {
                // 确保每个商店物品都有关联的物品信息
                if (!$shopItem->item) {
                    // 如果物品不存在，创建一个Item模型实例而不是数组
                    $shopItem->item = new Item([
                        'id' => $shopItem->item_id,
                        'name' => '未知物品',
                        'description' => '物品信息不可用',
                        'type' => '未知类型',
                        'is_consumable' => false
                    ]);
                }
                return $shopItem;
            });

        return response()->json([
            'success' => true,
            'shop' => $shop,
            'shop_items' => $shopItems
        ]);
    }

    /**
     * 根据地图获取商店
     */
    public function getShopsByMap(Request $request)
    {
        $user = Auth::user();
        $character = $user->character;

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 获取当前地图的商店
        $shops = Shop::where('map_id', $character->current_map_id)->get();

        return response()->json([
            'success' => true,
            'shops' => $shops
        ]);
    }

    /**
     * 购买商店物品
     */
    public function buy(Request $request)
    {
        $request->validate([
            'shop_item_id' => 'required|integer|exists:shop_items,id',
            'quantity' => 'integer|min:1|max:100',
        ]);

        $shopItemId = $request->shop_item_id;
        $quantity = $request->quantity ?? 1; // 默认购买数量为1

        $character = Auth::user()->character;
        $shopItem = ShopItem::with('item')->find($shopItemId);

        if (!$shopItem) {
            return response()->json([
                'success' => false,
                'message' => '商品不存在'
            ]);
        }

        // 计算总价
        $totalPrice = $shopItem->price * $quantity;

        // 检查金币是否足够
        if ($character->gold < $totalPrice) {
            return response()->json([
                'success' => false,
                'message' => '金币不足'
            ]);
        }

        // 检查物品是否为消耗品
        $isConsumable = $shopItem->item->is_consumable;
        
        // 如果不是消耗品，检查是否已拥有
        if (!$isConsumable) {
            $existingItem = $character->items()->where('item_id', $shopItem->item_id)->first();
            if ($existingItem) {
                return response()->json([
                    'success' => false,
                    'message' => '你已经拥有此物品'
                ]);
            }
            
            // 非消耗品只能购买一个
            $quantity = 1;
        }

        // 扣除金币
        $character->gold -= $totalPrice;
        $character->save();

        // 添加物品到背包
        if ($isConsumable) {
            // 对于消耗品，检查是否已有该物品，如果有则增加数量
            $existingItem = $character->items()->where('item_id', $shopItem->item_id)->first();
            
            if ($existingItem) {
                $existingItem->pivot->quantity += $quantity;
                $existingItem->pivot->save();
            } else {
                $character->items()->attach($shopItem->item_id, ['quantity' => $quantity]);
            }
        } else {
            // 非消耗品直接添加
            $character->items()->attach($shopItem->item_id, ['quantity' => 1]);
        }

        // 获取角色背包物品
        $inventory = Inventory::where('character_id', $character->id)
            ->with('item')
            ->get();

        return response()->json([
            'success' => true,
            'message' => "成功购买 {$quantity} 个 {$shopItem->item->name}",
            'character' => $character,
            'current_gold' => $character->gold,
            'inventory' => $inventory
        ]);
    }

    /**
     * 出售物品
     */
    public function sellItem(Request $request)
    {
        $request->validate([
            'character_item_id' => 'required|exists:inventories,id',
            'quantity' => 'required|integer|min:1',
            'shop_id' => 'required|exists:shops,id',
        ]);

        $user = Auth::user();
        $character = $user->character;

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
                'message' => '已装备的物品不能出售，请先卸下'
            ], 400);
        }

        // 检查数量是否合法
        if ($request->quantity > $inventoryItem->quantity) {
            return response()->json([
                'success' => false,
                'message' => '出售数量超过拥有数量'
            ], 400);
        }

        $shop = Shop::find($request->shop_id);
        
        // 检查商店是否在当前地图
        if ($shop->map_id != $character->current_map_id) {
            return response()->json([
                'success' => false,
                'message' => '商店不在当前地图'
            ], 400);
        }

        // 计算出售价格（通常为购买价的一半）
        $shopItem = ShopItem::where('shop_id', $shop->id)
            ->where('item_id', $inventoryItem->item_id)
            ->first();

        $sellPrice = $shopItem ? $shopItem->price * 0.5 : $inventoryItem->item->base_price * 0.5;
        $totalSellPrice = round($sellPrice * $request->quantity);

        // 增加金币
        $character->gold += $totalSellPrice;
        $character->save();

        // 减少物品数量
        $inventoryItem->quantity -= $request->quantity;
        if ($inventoryItem->quantity <= 0) {
            $inventoryItem->delete();
        } else {
            $inventoryItem->save();
        }

        // 广播出售物品事件
        event(new GameEvent('shop.sell', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'item_id' => $inventoryItem->item_id,
            'item_name' => $inventoryItem->item->name,
            'quantity' => $request->quantity,
            'total_price' => $totalSellPrice
        ], $character->map_id));

        return response()->json([
            'success' => true,
            'message' => '成功出售' . $request->quantity . '个' . $inventoryItem->item->name . '，获得' . $totalSellPrice . '金币',
            'character' => $character,
            'inventory' => Inventory::where('character_id', $character->id)->with('item')->get()
        ]);
    }
}
