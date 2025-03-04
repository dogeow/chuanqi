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
    // 稀有度映射表
    private const RARITY_THRESHOLDS = [
        98 => 'legendary',
        90 => 'epic',
        70 => 'rare',
        40 => 'uncommon',
        0 => 'common'
    ];

    // 稀有度包含关系
    private const RARITY_INCLUDES = [
        'legendary' => ['legendary', 'epic', 'rare', 'uncommon', 'common'],
        'epic' => ['epic', 'rare', 'uncommon', 'common'],
        'rare' => ['rare', 'uncommon', 'common'],
        'uncommon' => ['uncommon', 'common'],
        'common' => ['common']
    ];

    /**
     * 处理怪物掉落物品
     *
     * @param Monster $monster 被击杀的怪物
     * @param Character $character 击杀怪物的角色
     * @return array 掉落的物品信息
     */
    public function processMonsterDrop(Monster $monster, Character $character): array
    {
        // 获取怪物的掉落配置
        $dropRates = DropRate::where('monster_id', $monster->id)->get();
        
        // 如果没有配置掉落，随机选择一些物品
        if ($dropRates->isEmpty()) {
            return $this->generateRandomDrops($monster, $character);
        }
        
        // 根据配置的掉落率处理
        return $this->processConfiguredDrops($dropRates, $character);
    }
    
    /**
     * 处理配置的掉落
     * 
     * @param \Illuminate\Database\Eloquent\Collection $dropRates 掉落配置
     * @param Character $character 角色
     * @return array 掉落的物品信息
     */
    private function processConfiguredDrops($dropRates, Character $character): array
    {
        $droppedItems = [];
        
        foreach ($dropRates as $dropRate) {
            // 随机判断是否掉落 (将百分比转换为万分比)
            if (mt_rand(1, 10000) > $dropRate->rate * 100) {
                continue;
            }
            
            // 确定掉落数量
            $quantity = mt_rand($dropRate->min_quantity, $dropRate->max_quantity);
            
            if ($quantity <= 0) {
                continue;
            }
            
            // 获取物品信息
            $item = Item::find($dropRate->item_id);
            
            if (!$item) {
                continue;
            }
            
            // 添加到角色背包
            $this->addItemToInventory($character, $item, $quantity);
            
            // 记录掉落信息
            $droppedItems[] = $this->formatDroppedItem($item, $quantity);
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
    private function generateRandomDrops(Monster $monster, Character $character): array
    {
        $droppedItems = [];
        
        // 根据怪物等级决定掉落概率和物品稀有度
        $dropChance = min(30, 10 + $monster->level); // 基础掉落概率10%，随等级提高，最高30%
        
        // 随机判断是否掉落物品
        if (mt_rand(1, 100) <= $dropChance) {
            $droppedItems = $this->processRandomItemDrop($character);
        }
        
        // 技能书掉落（5%概率）
        if (mt_rand(1, 100) <= 5) {
            $skillBookDrop = $this->processSkillBookDrop($character);
            if (!empty($skillBookDrop)) {
                $droppedItems = array_merge($droppedItems, $skillBookDrop);
            }
        }
        
        return $droppedItems;
    }
    
    /**
     * 处理随机物品掉落
     *
     * @param Character $character 角色
     * @return array 掉落的物品信息
     */
    private function processRandomItemDrop(Character $character): array
    {
        // 确定物品稀有度
        $rarityRoll = mt_rand(1, 100);
        $rarity = $this->determineRarity($rarityRoll);
        
        // 获取符合条件的物品
        $item = $this->findRandomItem($character, $rarity);
        
        if (!$item) {
            return [];
        }
        
        // 确定数量
        $quantity = $item->is_consumable ? mt_rand(1, 3) : 1;
        
        // 添加到角色背包
        $this->addItemToInventory($character, $item, $quantity);
        
        // 返回掉落信息
        return [$this->formatDroppedItem($item, $quantity)];
    }
    
    /**
     * 处理技能书掉落
     *
     * @param Character $character 角色
     * @return array 掉落的物品信息
     */
    private function processSkillBookDrop(Character $character): array
    {
        $skillBook = Item::where('type', 'skill_book')
            ->where('level_required', '<=', $character->level + 3)
            ->inRandomOrder()
            ->first();
        
        if (!$skillBook) {
            return [];
        }
        
        // 添加到角色背包
        $this->addItemToInventory($character, $skillBook, 1);
        
        // 返回掉落信息
        return [$this->formatDroppedItem($skillBook, 1)];
    }
    
    /**
     * 根据掷骰结果确定稀有度
     *
     * @param int $rarityRoll 稀有度掷骰结果
     * @return string 稀有度
     */
    private function determineRarity(int $rarityRoll): string
    {
        foreach (self::RARITY_THRESHOLDS as $threshold => $rarity) {
            if ($rarityRoll > $threshold) {
                return $rarity;
            }
        }
        
        return 'common';
    }
    
    /**
     * 查找随机物品
     *
     * @param Character $character 角色
     * @param string $rarity 稀有度
     * @return Item|null 物品
     */
    private function findRandomItem(Character $character, string $rarity): ?Item
    {
        return Item::where('level_required', '<=', $character->level + 5)
            ->whereIn('rarity', self::RARITY_INCLUDES[$rarity] ?? ['common'])
            ->inRandomOrder()
            ->first();
    }
    
    /**
     * 格式化掉落物品信息
     *
     * @param Item $item 物品
     * @param int $quantity 数量
     * @return array 格式化后的物品信息
     */
    private function formatDroppedItem(Item $item, int $quantity): array
    {
        return [
            'item_id' => $item->id,
            'item_name' => $item->name,
            'quantity' => $quantity,
            'rarity' => $item->rarity,
            'image' => $item->image
        ];
    }
    
    /**
     * 将物品添加到角色背包
     *
     * @param Character $character 角色
     * @param Item $item 物品
     * @param int $quantity 数量
     * @return void
     */
    private function addItemToInventory(Character $character, Item $item, int $quantity): void
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