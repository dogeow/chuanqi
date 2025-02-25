<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Map;
use App\Models\Monster;
use App\Models\Shop;
use App\Models\Item;
use App\Models\ShopItem;
use App\Models\Skill;
use App\Models\DropRate;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        // 创建新手村地图
        $starterMap = Map::create([
            'name' => '新手村',
            'description' => '初始的村庄，这里有友善的NPC和适合新手的怪物。',
            'level_required' => 1,
            'type' => 'normal',
            'width' => 1000,
            'height' => 800,
            'background_image' => 'maps/starter.jpg',
            'spawn_points' => json_encode([
                ['x' => 100, 'y' => 100],
                ['x' => 200, 'y' => 200],
                ['x' => 300, 'y' => 300],
            ]),
            'teleport_points' => json_encode([
                ['x' => 950, 'y' => 400, 'target_map_id' => 2, 'target_x' => 50, 'target_y' => 400],
            ]),
        ]);

        // 创建怪物
        $slime = Monster::create([
            'name' => '史莱姆',
            'description' => '最基础的怪物，软软的，看起来人畜无害。',
            'level' => 1,
            'hp' => 50,
            'current_hp' => 50,
            'attack' => 5,
            'defense' => 2,
            'exp_reward' => 10,
            'gold_reward' => 5,
            'respawn_time' => 30,
            'map_id' => $starterMap->id,
            'position_x' => 400,
            'position_y' => 300,
            'image' => 'monsters/slime.png',
        ]);
        
        $goblin = Monster::create([
            'name' => '哥布林',
            'description' => '小型绿皮怪物，行动敏捷，喜欢成群结队地袭击旅行者。',
            'level' => 2,
            'hp' => 80,
            'current_hp' => 80,
            'attack' => 8,
            'defense' => 3,
            'exp_reward' => 15,
            'gold_reward' => 8,
            'respawn_time' => 45,
            'map_id' => $starterMap->id,
            'position_x' => 600,
            'position_y' => 400,
            'image' => 'monsters/goblin.png',
        ]);
        
        $wolf = Monster::create([
            'name' => '野狼',
            'description' => '凶猛的野生狼，领地意识强，会主动攻击闯入者。',
            'level' => 3,
            'hp' => 120,
            'current_hp' => 120,
            'attack' => 12,
            'defense' => 5,
            'exp_reward' => 20,
            'gold_reward' => 12,
            'respawn_time' => 60,
            'map_id' => $starterMap->id,
            'position_x' => 800,
            'position_y' => 500,
            'image' => 'monsters/wolf.png',
        ]);

        // 创建物品
        $healthPotion = Item::create([
            'name' => '初级生命药水',
            'description' => '恢复30点生命值',
            'type' => 'potion',
            'rarity' => 'common',
            'level_required' => 1,
            'hp_bonus' => 30,
            'buy_price' => 50,
            'sell_price' => 25,
            'is_tradable' => true,
            'is_consumable' => true,
            'image' => 'items/health_potion.png',
        ]);

        $woodenSword = Item::create([
            'name' => '木剑',
            'description' => '新手用的木制剑',
            'type' => 'weapon',
            'rarity' => 'common',
            'level_required' => 1,
            'attack_bonus' => 5,
            'buy_price' => 100,
            'sell_price' => 50,
            'is_tradable' => true,
            'is_consumable' => false,
            'image' => 'items/wooden_sword.png',
        ]);

        // 创建商店
        $generalShop = Shop::create([
            'name' => '杂货店',
            'description' => '销售各种日常用品和基础装备',
            'map_id' => $starterMap->id,
            'position_x' => 150,
            'position_y' => 150,
            'type' => 'general',
            'image' => 'shops/general.png',
        ]);

        // 添加商店物品
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $healthPotion->id,
            'price' => $healthPotion->buy_price,
            'stock' => -1,
        ]);

        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $woodenSword->id,
            'price' => $woodenSword->buy_price,
            'stock' => -1,
        ]);

        // 创建技能
        Skill::create([
            'name' => '突刺',
            'description' => '向前突进并刺击敌人',
            'cooldown' => 5,
            'mp_cost' => 10,
            'damage' => 15,
            'effect_type' => 'damage',
            'effect_value' => 0,
            'effect_duration' => 0,
            'level_required' => 1,
            'icon' => 'skills/thrust.png',
        ]);

        // 设置掉落率
        DropRate::create([
            'monster_id' => $slime->id,
            'item_id' => $healthPotion->id,
            'rate' => 20.00,
            'min_quantity' => 1,
            'max_quantity' => 1,
        ]);
    }
} 