<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ShopController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// 游戏相关路由
Route::middleware('auth:sanctum')->group(function () {
    // 角色相关
    Route::get('/character', [GameController::class, 'getCharacter']);
    Route::post('/character/move', [GameController::class, 'moveCharacter']);
    
    // 地图相关
    Route::get('/map/{mapId}', [GameController::class, 'getMap']);
    Route::post('/map/change', [GameController::class, 'changeMap']);
    
    // 怪物相关
    Route::post('/monster/attack', [GameController::class, 'attackMonster']);
    
    // 技能相关
    Route::get('/skills', [SkillController::class, 'getSkills']);
    Route::post('/skill/learn', [SkillController::class, 'learnSkill']);
    Route::post('/skill/use', [SkillController::class, 'useSkill']);
    Route::post('/skill/upgrade', [SkillController::class, 'upgradeSkill']);
    
    // 背包相关
    Route::get('/inventory', [InventoryController::class, 'getInventory']);
    Route::post('/item/use', [InventoryController::class, 'useItem']);
    Route::post('/item/equip', [InventoryController::class, 'equipItem']);
    Route::post('/item/unequip', [InventoryController::class, 'unequipItem']);
    Route::post('/item/drop', [InventoryController::class, 'dropItem']);
    
    // 商店相关
    Route::get('/shop/{shopId}', [ShopController::class, 'getShop']);
    Route::get('/shops/map/{mapId}', [ShopController::class, 'getShopsByMap']);
    Route::post('/shop/buy', [ShopController::class, 'buyItem']);
    Route::post('/shop/sell', [ShopController::class, 'sellItem']);
}); 