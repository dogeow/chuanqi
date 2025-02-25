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
        $character = Character::where('user_id', $user->id)->first();

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
        
        // 获取商店物品
        $shopItems = ShopItem::where('shop_id', $shop->id)
            ->with('item')
            ->get();

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
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 获取当前地图的商店
        $shops = Shop::where('map_id', $character->map_id)->get();

        return response()->json([
            'success' => true,
            'shops' => $shops
        ]);
    }

    /**
     * 购买物品
     */
    public function buyItem(Request $request)
    {
        $request->validate([
            'shop_item_id' => 'required|exists:shop_items,id',
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

        $shopItem = ShopItem::with('item', 'shop')->find($request->shop_item_id);
        
        // 检查商店是否在当前地图
        if ($shopItem->shop->map_id != $character->map_id) {
            return response()->json([
                'success' => false,
                'message' => '商店不在当前地图'
            ], 400);
        }

        // 计算总价
        $totalPrice = $shopItem->price * $request->quantity;
        
        // 检查金币是否足够
        if ($user->gold < $totalPrice) {
            return response()->json([
                'success' => false,
                'message' => '金币不足'
            ], 400);
        }

        // 扣除金币
        $user->gold -= $totalPrice;
        $user->save();

        // 添加物品到背包
        $existingItem = Inventory::where('character_id', $character->id)
            ->where('item_id', $shopItem->item_id)
            ->where('is_equipped', false)
            ->first();

        if ($existingItem) {
            // 已有该物品，增加数量
            $existingItem->quantity += $request->quantity;
            $existingItem->save();
        } else {
            // 没有该物品，创建新记录
            $inventoryItem = new Inventory();
            $inventoryItem->character_id = $character->id;
            $inventoryItem->item_id = $shopItem->item_id;
            $inventoryItem->quantity = $request->quantity;
            $inventoryItem->is_equipped = false;
            $inventoryItem->save();
        }

        // 广播购买物品事件
        event(new GameEvent('shop.buy', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'item_id' => $shopItem->item_id,
            'item_name' => $shopItem->item->name,
            'quantity' => $request->quantity,
            'total_price' => $totalPrice
        ], $character->map_id));

        return response()->json([
            'success' => true,
            'message' => '成功购买' . $request->quantity . '个' . $shopItem->item->name,
            'character' => $character,
            'inventory' => Inventory::where('character_id', $character->id)->with('item')->get()
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
        if ($shop->map_id != $character->map_id) {
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
        $user->gold += $totalSellPrice;
        $user->save();

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
