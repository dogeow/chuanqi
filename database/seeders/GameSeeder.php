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
        
        // 森林地图的怪物
        $spider = Monster::create([
            'name' => '巨型蜘蛛',
            'description' => '森林中的大型蜘蛛，毒性不强但喜欢结网捕猎。',
            'level' => 6,
            'hp' => 150,
            'current_hp' => 150,
            'attack' => 15,
            'defense' => 8,
            'exp_reward' => 30,
            'gold_reward' => 18,
            'respawn_time' => 60,
            'map_id' => $forestMap->id,
            'position_x' => 350,
            'position_y' => 280,
            'image' => 'monsters/spider.png',
        ]);
        
        $bear = Monster::create([
            'name' => '黑熊',
            'description' => '森林中的猛兽，体型庞大，攻击力惊人。',
            'level' => 9,
            'hp' => 300,
            'current_hp' => 300,
            'attack' => 22,
            'defense' => 12,
            'exp_reward' => 50,
            'gold_reward' => 30,
            'respawn_time' => 120,
            'map_id' => $forestMap->id,
            'position_x' => 800,
            'position_y' => 500,
            'image' => 'monsters/bear.png',
        ]);
        
        // 矿洞地图的怪物
        $bat = Monster::create([
            'name' => '洞穴蝙蝠',
            'description' => '栖息在矿洞中的大型蝙蝠，行动迅速，难以命中。',
            'level' => 12,
            'hp' => 180,
            'current_hp' => 180,
            'attack' => 25,
            'defense' => 10,
            'exp_reward' => 60,
            'gold_reward' => 35,
            'respawn_time' => 60,
            'map_id' => $caveMap->id,
            'position_x' => 300,
            'position_y' => 200,
            'image' => 'monsters/bat.png',
        ]);
        
        $golem = Monster::create([
            'name' => '石魔像',
            'description' => '由岩石构成的魔像，防御力极高，行动缓慢。',
            'level' => 15,
            'hp' => 500,
            'current_hp' => 500,
            'attack' => 28,
            'defense' => 30,
            'exp_reward' => 100,
            'gold_reward' => 60,
            'respawn_time' => 180,
            'map_id' => $caveMap->id,
            'position_x' => 600,
            'position_y' => 400,
            'image' => 'monsters/golem.png',
        ]);
        
        // 沙漠地图的怪物
        $scorpion = Monster::create([
            'name' => '巨型蝎子',
            'description' => '沙漠中常见的大型蝎子，尾部带有剧毒。',
            'level' => 18,
            'hp' => 250,
            'current_hp' => 250,
            'attack' => 35,
            'defense' => 15,
            'exp_reward' => 120,
            'gold_reward' => 70,
            'respawn_time' => 90,
            'map_id' => $desertMap->id,
            'position_x' => 400,
            'position_y' => 300,
            'image' => 'monsters/scorpion.png',
        ]);
        
        $mummy = Monster::create([
            'name' => '木乃伊',
            'description' => '远古遗迹中复活的木乃伊，行动缓慢但生命力顽强。',
            'level' => 20,
            'hp' => 600,
            'current_hp' => 600,
            'attack' => 40,
            'defense' => 25,
            'exp_reward' => 150,
            'gold_reward' => 100,
            'respawn_time' => 240,
            'map_id' => $desertMap->id,
            'position_x' => 600,
            'position_y' => 400,
            'image' => 'monsters/mummy.png',
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