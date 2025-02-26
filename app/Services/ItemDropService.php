<?php

namespace App\Services;

use App\Models\Monster;
use App\Models\Character;
use App\Models\DropRate;
use App\Models\Inventory;
use App\Models\Item;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ItemDropService
{
    /**
     * 处理怪物掉落物品
     *
     * @param Monster $monster 被击杀的怪物
     * @param Character $character 击杀怪物的角色
     * @return array 掉落的物品信息
     */
    public function processMonsterDrop(Monster $monster, Character $character)
    {
        $droppedItems = [];
        
        // 获取怪物的掉落配置
        $dropRates = DropRate::where('monster_id', $monster->id)->get();
        
        if ($dropRates->isEmpty()) {
            // 如果没有配置掉落，随机选择一些物品
            $droppedItems = $this->generateRandomDrops($monster, $character);
        } else {
            // 根据配置的掉落率处理
            foreach ($dropRates as $dropRate) {
                // 随机判断是否掉落
                if (mt_rand(1, 10000) <= $dropRate->rate * 100) { // 将百分比转换为万分比
                    // 确定掉落数量
                    $quantity = mt_rand($dropRate->min_quantity, $dropRate->max_quantity);
                    
                    if ($quantity > 0) {
                        // 获取物品信息
                        $item = Item::find($dropRate->item_id);
                        
                        if ($item) {
                            // 添加到角色背包
                            Log::info('yes');
                            $this->addItemToInventory($character, $item, $quantity);
                            
                            // 记录掉落信息
                            $droppedItems[] = [
                                'item_id' => $item->id,
                                'item_name' => $item->name,
                                'quantity' => $quantity,
                                'rarity' => $item->rarity,
                                'image' => $item->image
                            ];
                        }
                    }
                }
            }
        }
        
        return $droppedItems;
    }
    
    /**
     * 生成随机掉落物品
     *
     * @param Monster $monster 被击杀的怪物
     * @param Character $character 击杀怪物的角色
     * @return array 掉落的物品信息
     */
    private function generateRandomDrops(Monster $monster, Character $character)
    {
        $droppedItems = [];
        
        // 根据怪物等级决定掉落概率和物品稀有度
        $dropChance = 100; // 基础掉落概率10%，随等级提高，最高30%
        
        // 记录调试信息
        Log::info('尝试生成随机掉落', [
            'monster_id' => $monster->id,
            'monster_name' => $monster->name,
            'monster_level' => $monster->level,
            'character_id' => $character->id,
            'character_level' => $character->level,
            'drop_chance' => $dropChance
        ]);
        
        // 随机判断是否掉落物品
        if (mt_rand(1, 100) <= $dropChance) {
            // 确定物品稀有度
            $rarityRoll = mt_rand(1, 100);
            $rarity = 'common';
            
            if ($rarityRoll > 98) {
                $rarity = 'legendary';
            } elseif ($rarityRoll > 90) {
                $rarity = 'epic';
            } elseif ($rarityRoll > 70) {
                $rarity = 'rare';
            } elseif ($rarityRoll > 40) {
                $rarity = 'uncommon';
            }
            
            Log::info('尝试查找符合条件的物品', [
                'rarity' => $rarity,
                'character_level' => $character->level,
                'max_level_required' => $character->level + 5
            ]);
            
            // 获取符合条件的物品
            $items = Item::where('level_required', '<=', $character->level + 5)
                ->where(function($query) use ($rarity) {
                    if ($rarity === 'legendary') {
                        $query->whereIn('rarity', ['legendary', 'epic', 'rare', 'uncommon', 'common']);
                    } elseif ($rarity === 'epic') {
                        $query->whereIn('rarity', ['epic', 'rare', 'uncommon', 'common']);
                    } elseif ($rarity === 'rare') {
                        $query->whereIn('rarity', ['rare', 'uncommon', 'common']);
                    } elseif ($rarity === 'uncommon') {
                        $query->whereIn('rarity', ['uncommon', 'common']);
                    } else {
                        $query->where('rarity', 'common');
                    }
                })
                ->inRandomOrder()
                ->limit(1)
                ->get();
            
            Log::info('查询结果', [
                'items_count' => $items->count(),
                'sql' => Item::where('level_required', '<=', $character->level + 5)
                    ->where(function($query) use ($rarity) {
                        if ($rarity === 'legendary') {
                            $query->whereIn('rarity', ['legendary', 'epic', 'rare', 'uncommon', 'common']);
                        } elseif ($rarity === 'epic') {
                            $query->whereIn('rarity', ['epic', 'rare', 'uncommon', 'common']);
                        } elseif ($rarity === 'rare') {
                            $query->whereIn('rarity', ['rare', 'uncommon', 'common']);
                        } elseif ($rarity === 'uncommon') {
                            $query->whereIn('rarity', ['uncommon', 'common']);
                        } else {
                            $query->where('rarity', 'common');
                        }
                    })
                    ->toSql()
            ]);
            
            if ($items->isNotEmpty()) {
                $item = $items->first();
                $quantity = 1;
                
                // 如果是消耗品，可能掉落多个
                if ($item->is_consumable) {
                    $quantity = mt_rand(1, 3);
                }
                
                // 添加到角色背包
                $this->addItemToInventory($character, $item, $quantity);
                
                // 记录掉落信息
                $droppedItems[] = [
                    'item_id' => $item->id,
                    'item_name' => $item->name,
                    'quantity' => $quantity,
                    'rarity' => $item->rarity,
                    'image' => $item->image
                ];
                
                Log::info('成功添加物品到掉落列表', [
                    'item_id' => $item->id,
                    'item_name' => $item->name,
                    'quantity' => $quantity
                ]);
            } else {
                Log::warning('没有找到符合条件的物品');
            }
        } else {
            Log::info('随机判定未通过掉落检查', [
                'roll' => mt_rand(1, 100),
                'drop_chance' => $dropChance
            ]);
        }
        
        // 技能书掉落（较低概率）
        if (mt_rand(1, 100) <= 5) { // 5%概率掉落技能书
            Log::info('尝试掉落技能书');
            
            $skillBooks = Item::where('type', 'skill_book')
                ->where('level_required', '<=', $character->level + 3)
                ->inRandomOrder()
                ->limit(1)
                ->get();
            
            Log::info('技能书查询结果', [
                'skill_books_count' => $skillBooks->count(),
                'sql' => Item::where('type', 'skill_book')
                    ->where('level_required', '<=', $character->level + 3)
                    ->toSql()
            ]);
            
            if ($skillBooks->isNotEmpty()) {
                $skillBook = $skillBooks->first();
                
                // 添加到角色背包
                $this->addItemToInventory($character, $skillBook, 1);
                
                // 记录掉落信息
                $droppedItems[] = [
                    'item_id' => $skillBook->id,
                    'item_name' => $skillBook->name,
                    'quantity' => 1,
                    'rarity' => $skillBook->rarity,
                    'image' => $skillBook->image
                ];
                
                Log::info('成功添加技能书到掉落列表', [
                    'skill_book_id' => $skillBook->id,
                    'skill_book_name' => $skillBook->name
                ]);
            } else {
                Log::warning('没有找到符合条件的技能书');
            }
        }
        
        return $droppedItems;
    }
    
    /**
     * 将物品添加到角色背包
     *
     * @param Character $character 角色
     * @param Item $item 物品
     * @param int $quantity 数量
     * @return void
     */
    private function addItemToInventory(Character $character, Item $item, int $quantity)
    {
        try {
            // 检查背包中是否已有该物品
            $existingItem = Inventory::where('character_id', $character->id)
                ->where('item_id', $item->id)
                ->where('is_equipped', false)
                ->first();
            
            if ($existingItem) {
                // 已有该物品，增加数量
                $existingItem->quantity += $quantity;
                $existingItem->save();
            } else {
                // 没有该物品，创建新记录
                Inventory::create([
                    'character_id' => $character->id,
                    'item_id' => $item->id,
                    'quantity' => $quantity,
                    'is_equipped' => false
                ]);
            }
        } catch (\Exception $e) {
            Log::error('添加物品到背包失败: ' . $e->getMessage(), [
                'character_id' => $character->id,
                'item_id' => $item->id,
                'quantity' => $quantity
            ]);
        }
    }
} 