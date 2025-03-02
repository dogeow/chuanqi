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
use Illuminate\Support\Facades\DB;

class GameSeeder extends Seeder
{
    const WIDTH = 600;
    const HEIGHT = 600;

    public function run(): void
    {
        // 创建落霞岛地图
        $starterMap = Map::create([
            'name' => '落霞岛',
            'description' => '桃源世界，这里有友善的NPC和可爱的动物们。',
            'level_required' => 1,
            'type' => 'normal',
            'width' => self::WIDTH,
            'height' => self::HEIGHT,
            'background_image' => 'maps/starter.jpg',
            'spawn_points' => json_encode([
                ['x' => 100, 'y' => 100],
                ['x' => 200, 'y' => 200],
                ['x' => 300, 'y' => 300],
            ]),
            'teleport_points' => json_encode([
                ['x' => 550, 'y' => 100, 'target_map_id' => 2, 'target_x' => 50, 'target_y' => 400, 'name' => '幽暗森林'],
                ['x' => 550, 'y' => 200, 'target_map_id' => 3, 'target_x' => 50, 'target_y' => 200, 'name' => '古老矿洞'],
                ['x' => 550, 'y' => 300, 'target_map_id' => 4, 'target_x' => 50, 'target_y' => 400, 'name' => '炽热沙漠'],
            ]),
        ]);

        // 创建森林地图
        $forestMap = Map::create([
            'name' => '幽暗森林',
            'description' => '茂密的森林，阳光难以穿透树冠，隐藏着各种危险生物。',
            'level_required' => 5,
            'type' => 'normal',
            'width' => self::WIDTH,
            'height' => self::HEIGHT,
            'background_image' => 'maps/forest.jpg',
            'spawn_points' => json_encode([
                ['x' => 100, 'y' => 100],
                ['x' => 200, 'y' => 200],
                ['x' => 300, 'y' => 300],
            ]),
            'teleport_points' => json_encode([
                ['x' => 50, 'y' => 400, 'target_map_id' => 1, 'target_x' => 750, 'target_y' => 400, 'name' => '落霞岛'],
                ['x' => 550, 'y' => 400, 'target_map_id' => 3, 'target_x' => 50, 'target_y' => 400, 'name' => '古老矿洞'],
            ]),
        ]);

        // 创建矿洞地图
        $caveMap = Map::create([
            'name' => '古老矿洞',
            'description' => '昏暗的地下洞窟，曾经是矮人的矿场，现在被各种生物占据。',
            'level_required' => 10,
            'type' => 'dungeon',
            'width' => self::WIDTH,
            'height' => self::HEIGHT,
            'background_image' => 'maps/cave.jpg',
            'spawn_points' => json_encode([
                ['x' => 100, 'y' => 100],
                ['x' => 200, 'y' => 200],
                ['x' => 300, 'y' => 300],
            ]),
            'teleport_points' => json_encode([
                ['x' => 50, 'y' => 200, 'target_map_id' => 1, 'target_x' => 100, 'target_y' => 100, 'name' => '落霞岛'],
                ['x' => 50, 'y' => 400, 'target_map_id' => 2, 'target_x' => 100, 'target_y' => 100, 'name' => '幽暗森林'],
                ['x' => 550, 'y' => 400, 'target_map_id' => 4, 'target_x' => 100, 'target_y' => 100, 'name' => '炽热沙漠'],
            ]),
        ]);

        // 创建沙漠地图
        $desertMap = Map::create([
            'name' => '炽热沙漠',
            'description' => '一片荒芜的沙漠，白天烈日炎炎，夜晚寒冷刺骨，隐藏着远古的遗迹。',
            'level_required' => 15,
            'type' => 'normal',
            'width' => self::WIDTH,
            'height' => self::HEIGHT,
            'background_image' => 'maps/desert.jpg',
            'spawn_points' => json_encode([
                ['x' => 100, 'y' => 100],
                ['x' => 200, 'y' => 200],
                ['x' => 300, 'y' => 300],
            ]),
            'teleport_points' => json_encode([
                ['x' => 550, 'y' => 400, 'target_map_id' => 1, 'target_x' => 100, 'target_y' => 100, 'name' => '落霞岛'],
                ['x' => 550, 'y' => 200, 'target_map_id' => 3, 'target_x' => 100, 'target_y' => 100, 'name' => '古老矿洞'],
            ]),
        ]);

        // 在落霞岛创建低级怪物
                
        $toad = Monster::create([
            'name' => '癞蛤蟆',
            'description' => '生活在落霞岛附近的大癞蛤蟆，偶尔会吐出黏液攻击路过的冒险者。',
            'level' => 1,
            'hp' => 10,
            'current_hp' => 10,
            'attack' => 1,
            'defense' => 1,
            'exp_reward' => 1,
            'gold_reward' => 1,
            'respawn_time' => 10,
            'map_id' => $starterMap->id,
            'position_x' => 100,
            'position_y' => 200,
            'image' => 'monsters/toad.png',
            'emoji' => '🐸',
        ]);

        $rabbit = Monster::create([
            'name' => '野兔',
            'description' => '一只可爱的野兔，看起来人畜无害，适合新手练习。',
            'level' => 1,
            'hp' => 20,
            'current_hp' => 20,
            'attack' => 2,
            'defense' => 2,
            'exp_reward' => 2,
            'gold_reward' => 2,
            'respawn_time' => 20,
            'map_id' => $starterMap->id,
            'position_x' => 300,
            'position_y' => 250,
            'image' => 'monsters/rabbit.png',
            'emoji' => '🐰',
        ]);
        
        $scarecrow = Monster::create([
            'name' => '稻草人',
            'description' => '农田里的稻草人，不知为何获得了生命，行动缓慢但有一定攻击力。',
            'level' => 1,
            'hp' => 30,
            'current_hp' => 30,
            'attack' => 3,
            'defense' => 3,
            'exp_reward' => 3,
            'gold_reward' => 3,
            'respawn_time' => 30,
            'map_id' => $starterMap->id,
            'position_x' => 450,
            'position_y' => 350,
            'image' => 'monsters/scarecrow.png',
            'emoji' => '🧟',
        ]);

        // 创建怪物
        $slime = Monster::create([
            'name' => '史莱姆',
            'description' => '最基础的怪物，软软的，看起来人畜无害。',
            'level' => 2,
            'hp' => 40,
            'current_hp' => 40,
            'attack' => 4,
            'defense' => 4,
            'exp_reward' => 4,
            'gold_reward' => 4,
            'respawn_time' => 40,
            'map_id' => $forestMap->id,
            'position_x' => 400,
            'position_y' => 300,
            'image' => 'monsters/slime.png',
            'emoji' => '🟢',
        ]);
        
        $goblin = Monster::create([
            'name' => '哥布林',
            'description' => '小型绿皮怪物，行动敏捷，喜欢成群结队地袭击旅行者。',
            'level' => 2,
            'hp' => 50,
            'current_hp' => 50,
            'attack' => 5,
            'defense' => 5,
            'exp_reward' => 5,
            'gold_reward' => 5,
            'respawn_time' => 50,
            'map_id' => $forestMap->id,
            'position_x' => 100,
            'position_y' => 400,
            'image' => 'monsters/goblin.png',
            'emoji' => '👺',
        ]);
        
        $wolf = Monster::create([
            'name' => '野狼',
            'description' => '凶猛的野生狼，领地意识强，会主动攻击闯入者。',
            'level' => 2,
            'hp' => 60,
            'current_hp' => 60,
            'attack' => 6,
            'defense' => 6,6
            'exp_reward' => 20,
            'gold_reward' => 6,
            'respawn_time' => 60,
            'map_id' => $forestMap->id,
            'position_x' => 100,
            'position_y' => 200,
            'image' => 'monsters/wolf.png',
            'emoji' => '🐺',
        ]);
        
        // 森林地图的怪物
        $spider = Monster::create([
            'name' => '巨型蜘蛛',
            'description' => '森林中的大型蜘蛛，毒性不强但喜欢结网捕猎。',
            'level' => 3,
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
            'emoji' => '🕷️',
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
            'position_x' => 200,
            'position_y' => 500,
            'image' => 'monsters/bear.png',
            'emoji' => '🐻',
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
            'emoji' => '🦇',
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
            'position_x' => 200,
            'position_y' => 400,
            'image' => 'monsters/golem.png',
            'emoji' => '🗿',
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
            'position_x' => 200,
            'position_y' => 300,
            'image' => 'monsters/scorpion.png',
            'emoji' => '🦂',
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
            'position_x' => 200,
            'position_y' => 400,
            'image' => 'monsters/mummy.png',
        ]);

        // 消耗品
        $consumables = [
            [
                'name' => '初级生命药水',
                'description' => '恢复50点生命值',
                'type' => 'consumable',
                'rarity' => 'common',
                'level_required' => 1,
                'hp_bonus' => 50,
                'buy_price' => 20,
                'sell_price' => 5,
                'is_tradable' => 1,
                'is_consumable' => 1,
                'is_equippable' => 0,
                'image' => '🧪',
            ],
            [
                'name' => '中级生命药水',
                'description' => '恢复150点生命值',
                'type' => 'consumable',
                'rarity' => 'uncommon',
                'level_required' => 5,
                'hp_bonus' => 150,
                'buy_price' => 50,
                'sell_price' => 12,
                'is_tradable' => 1,
                'is_consumable' => 1,
                'is_equippable' => 0,
                'image' => '🧪',
            ],
            [
                'name' => '高级生命药水',
                'description' => '恢复300点生命值',
                'type' => 'consumable',
                'rarity' => 'rare',
                'level_required' => 10,
                'hp_bonus' => 300,
                'buy_price' => 100,
                'sell_price' => 25,
                'is_tradable' => 1,
                'is_consumable' => 1,
                'is_equippable' => 0,
                'image' => '🧪',
            ],
            [
                'name' => '初级魔法药水',
                'description' => '恢复30点魔法值',
                'type' => 'consumable',
                'rarity' => 'common',
                'level_required' => 1,
                'mp_bonus' => 30,
                'buy_price' => 25,
                'sell_price' => 6,
                'is_tradable' => 1,
                'is_consumable' => 1,
                'is_equippable' => 0,
                'image' => '🧫',
            ],
            [
                'name' => '中级魔法药水',
                'description' => '恢复100点魔法值',
                'type' => 'consumable',
                'rarity' => 'uncommon',
                'level_required' => 5,
                'mp_bonus' => 100,
                'buy_price' => 60,
                'sell_price' => 15,
                'is_tradable' => 1,
                'is_consumable' => 1,
                'is_equippable' => 0,
                'image' => '🧫',
            ],
            [
                'name' => '高级魔法药水',
                'description' => '恢复200点魔法值',
                'type' => 'consumable',
                'rarity' => 'rare',
                'level_required' => 10,
                'mp_bonus' => 200,
                'buy_price' => 120,
                'sell_price' => 30,
                'is_tradable' => 1,
                'is_consumable' => 1,
                'is_equippable' => 0,
                'image' => '🧫',
            ],
        ];

        // 武器
        $weapons = [
            [
                'name' => '新手木剑',
                'description' => '新手常用的木制剑，攻击力较低',
                'type' => 'weapon',
                'rarity' => 'common',
                'level_required' => 1,
                'attack_bonus' => 5,
                'buy_price' => 50,
                'sell_price' => 10,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🗡️',
            ],
            [
                'name' => '铁制长剑',
                'description' => '普通铁匠打造的长剑，坚固耐用',
                'type' => 'weapon',
                'rarity' => 'common',
                'level_required' => 5,
                'attack_bonus' => 15,
                'buy_price' => 200,
                'sell_price' => 50,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '⚔️',
            ],
            [
                'name' => '精钢大剑',
                'description' => '使用精钢打造的大剑，攻击力显著提升',
                'type' => 'weapon',
                'rarity' => 'uncommon',
                'level_required' => 10,
                'attack_bonus' => 30,
                'buy_price' => 500,
                'sell_price' => 125,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '⚔️',
            ],
            [
                'name' => '寒冰之刃',
                'description' => '蕴含冰元素的魔法剑，可冻结敌人',
                'type' => 'weapon',
                'rarity' => 'rare',
                'level_required' => 15,
                'attack_bonus' => 45,
                'buy_price' => 1200,
                'sell_price' => 300,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '❄️⚔️',
            ],
            [
                'name' => '炎龙之怒',
                'description' => '传说中由龙息锻造的神剑，蕴含强大火元素力量',
                'type' => 'weapon',
                'rarity' => 'epic',
                'level_required' => 20,
                'attack_bonus' => 70,
                'buy_price' => 3000,
                'sell_price' => 750,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🔥⚔️',
            ],
        ];

        // 头盔
        $helmets = [
            [
                'name' => '皮革头盔',
                'description' => '简单的皮革头盔，提供基础防护',
                'type' => 'helmet',
                'rarity' => 'common',
                'level_required' => 1,
                'defense_bonus' => 3,
                'buy_price' => 40,
                'sell_price' => 10,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🪖',
            ],
            [
                'name' => '铁制头盔',
                'description' => '铁匠打造的坚固头盔',
                'type' => 'helmet',
                'rarity' => 'common',
                'level_required' => 5,
                'defense_bonus' => 8,
                'buy_price' => 160,
                'sell_price' => 40,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🪖',
            ],
            [
                'name' => '精钢头盔',
                'description' => '使用精钢打造的头盔，提供优秀防护',
                'type' => 'helmet',
                'rarity' => 'uncommon',
                'level_required' => 10,
                'defense_bonus' => 15,
                'buy_price' => 400,
                'sell_price' => 100,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🪖',
            ],
            [
                'name' => '智慧之冠',
                'description' => '蕴含魔法力量的头盔，增加魔法值',
                'type' => 'helmet',
                'rarity' => 'rare',
                'level_required' => 15,
                'defense_bonus' => 20,
                'mp_bonus' => 50,
                'buy_price' => 900,
                'sell_price' => 225,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '👑',
            ],
        ];

        // 靴子
        $boots = [
            [
                'name' => '皮革靴子',
                'description' => '简单的皮革靴子，提供基础防护',
                'type' => 'boots',
                'rarity' => 'common',
                'level_required' => 1,
                'defense_bonus' => 2,
                'buy_price' => 30,
                'sell_price' => 7,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '👢',
            ],
            [
                'name' => '铁制战靴',
                'description' => '铁匠打造的坚固战靴',
                'type' => 'boots',
                'rarity' => 'common',
                'level_required' => 5,
                'defense_bonus' => 6,
                'buy_price' => 120,
                'sell_price' => 30,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '👢',
            ],
            [
                'name' => '精钢战靴',
                'description' => '使用精钢打造的战靴，提供优秀防护',
                'type' => 'boots',
                'rarity' => 'uncommon',
                'level_required' => 10,
                'defense_bonus' => 12,
                'buy_price' => 300,
                'sell_price' => 75,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '👢',
            ],
            [
                'name' => '疾风之靴',
                'description' => '附魔的靴子，提高移动速度',
                'type' => 'boots',
                'rarity' => 'rare',
                'level_required' => 15,
                'defense_bonus' => 18,
                'buy_price' => 800,
                'sell_price' => 200,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🌪️👢',
            ],
        ];

        // 衣服/胸甲
        $armors = [
            [
                'name' => '皮革护甲',
                'description' => '简单的皮革护甲，提供基础防护',
                'type' => 'armor',
                'rarity' => 'common',
                'level_required' => 1,
                'defense_bonus' => 5,
                'buy_price' => 60,
                'sell_price' => 15,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🥋',
            ],
            [
                'name' => '铁制胸甲',
                'description' => '铁匠打造的坚固胸甲',
                'type' => 'armor',
                'rarity' => 'common',
                'level_required' => 5,
                'defense_bonus' => 12,
                'buy_price' => 240,
                'sell_price' => 60,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🥋',
            ],
            [
                'name' => '精钢板甲',
                'description' => '使用精钢打造的板甲，提供优秀防护',
                'type' => 'armor',
                'rarity' => 'uncommon',
                'level_required' => 10,
                'defense_bonus' => 25,
                'buy_price' => 600,
                'sell_price' => 150,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🥋',
            ],
            [
                'name' => '龙鳞胸甲',
                'description' => '使用龙鳞制作的胸甲，提供极佳防护',
                'type' => 'armor',
                'rarity' => 'rare',
                'level_required' => 15,
                'defense_bonus' => 40,
                'hp_bonus' => 100,
                'buy_price' => 1500,
                'sell_price' => 375,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🐉🥋',
            ],
        ];

        // 戒指
        $rings = [
            [
                'name' => '铜戒指',
                'description' => '普通的铜戒指，略微增加攻击力',
                'type' => 'ring',
                'rarity' => 'common',
                'level_required' => 1,
                'attack_bonus' => 2,
                'buy_price' => 50,
                'sell_price' => 12,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '💍',
            ],
            [
                'name' => '银戒指',
                'description' => '银制戒指，增加攻击力',
                'type' => 'ring',
                'rarity' => 'uncommon',
                'level_required' => 5,
                'attack_bonus' => 5,
                'buy_price' => 200,
                'sell_price' => 50,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '💍',
            ],
            [
                'name' => '金戒指',
                'description' => '金制戒指，显著增加攻击力',
                'type' => 'ring',
                'rarity' => 'rare',
                'level_required' => 10,
                'attack_bonus' => 10,
                'buy_price' => 500,
                'sell_price' => 125,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '💍',
            ],
            [
                'name' => '生命戒指',
                'description' => '蕴含生命能量的戒指，增加生命值',
                'type' => 'ring',
                'rarity' => 'rare',
                'level_required' => 15,
                'hp_bonus' => 100,
                'buy_price' => 800,
                'sell_price' => 200,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '❤️💍',
            ],
            [
                'name' => '魔法戒指',
                'description' => '蕴含魔法能量的戒指，增加魔法值',
                'type' => 'ring',
                'rarity' => 'rare',
                'level_required' => 15,
                'mp_bonus' => 80,
                'buy_price' => 800,
                'sell_price' => 200,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🔮💍',
            ],
        ];

        // 手镯
        $bracelets = [
            [
                'name' => '铜手镯',
                'description' => '普通的铜手镯，略微增加防御力',
                'type' => 'bracelet',
                'rarity' => 'common',
                'level_required' => 1,
                'defense_bonus' => 2,
                'buy_price' => 50,
                'sell_price' => 12,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '⚪',
            ],
            [
                'name' => '银手镯',
                'description' => '银制手镯，增加防御力',
                'type' => 'bracelet',
                'rarity' => 'uncommon',
                'level_required' => 5,
                'defense_bonus' => 5,
                'buy_price' => 200,
                'sell_price' => 50,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '⚪',
            ],
            [
                'name' => '金手镯',
                'description' => '金制手镯，显著增加防御力',
                'type' => 'bracelet',
                'rarity' => 'rare',
                'level_required' => 10,
                'defense_bonus' => 10,
                'buy_price' => 500,
                'sell_price' => 125,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '⚪',
            ],
            [
                'name' => '力量手镯',
                'description' => '蕴含力量能量的手镯，增加攻击力',
                'type' => 'bracelet',
                'rarity' => 'rare',
                'level_required' => 15,
                'attack_bonus' => 15,
                'buy_price' => 800,
                'sell_price' => 200,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '💪⚪',
            ],
        ];

        // 披风
        $cloaks = [
            [
                'name' => '布制披风',
                'description' => '普通的布制披风，提供基础防护',
                'type' => 'cloak',
                'rarity' => 'common',
                'level_required' => 1,
                'defense_bonus' => 2,
                'buy_price' => 40,
                'sell_price' => 10,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🧣',
            ],
            [
                'name' => '皮革披风',
                'description' => '皮革制作的披风，提供更好的防护',
                'type' => 'cloak',
                'rarity' => 'uncommon',
                'level_required' => 5,
                'defense_bonus' => 5,
                'buy_price' => 160,
                'sell_price' => 40,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🧣',
            ],
            [
                'name' => '精灵披风',
                'description' => '精灵编织的披风，轻盈且防护优秀',
                'type' => 'cloak',
                'rarity' => 'rare',
                'level_required' => 10,
                'defense_bonus' => 8,
                'mp_bonus' => 30,
                'buy_price' => 400,
                'sell_price' => 100,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '🧝‍♀️🧣',
            ],
            [
                'name' => '隐形披风',
                'description' => '传说中的隐形披风，可以在战斗中提供额外闪避',
                'type' => 'cloak',
                'rarity' => 'epic',
                'level_required' => 20,
                'defense_bonus' => 15,
                'buy_price' => 2000,
                'sell_price' => 500,
                'is_tradable' => 1,
                'is_consumable' => 0,
                'is_equippable' => 1,
                'image' => '👻🧣',
            ],
        ];

        // 合并所有物品
        $allItems = array_merge(
            $consumables,
            $weapons,
            $helmets,
            $boots,
            $armors,
            $rings,
            $bracelets,
            $cloaks
        );

        // 插入数据库
        foreach ($allItems as $item) {
            DB::table('items')->insert(array_merge($item, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

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
        // 从数据库获取物品ID
        $itemIds = DB::table('items')->pluck('id', 'name');
        
        // 添加消耗品到商店
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['初级生命药水'],
            'price' => 20,
            'stock' => 30,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['中级生命药水'],
            'price' => 50,
            'stock' => 15,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['初级魔法药水'],
            'price' => 25,
            'stock' => 30,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['中级魔法药水'],
            'price' => 60,
            'stock' => 15,
        ]);
        
        // 添加装备到商店
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['新手木剑'],
            'price' => 50,
            'stock' => 5,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['铁制长剑'],
            'price' => 200,
            'stock' => 3,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['皮革头盔'],
            'price' => 40,
            'stock' => 5,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['皮革靴子'],
            'price' => 30,
            'stock' => 5,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['皮革护甲'],
            'price' => 60,
            'stock' => 5,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['铜戒指'],
            'price' => 50,
            'stock' => 3,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['铜手镯'],
            'price' => 50,
            'stock' => 3,
        ]);
        
        ShopItem::create([
            'shop_id' => $generalShop->id,
            'item_id' => $itemIds['布制披风'],
            'price' => 40,
            'stock' => 5,
        ]);
        
        // 创建森林地图的商店
        $forestShop = Shop::create([
            'name' => '森林商人',
            'description' => '在森林中经营的神秘商人，提供一些特殊物品',
            'map_id' => $forestMap->id,
            'position_x' => 250,
            'position_y' => 200,
            'type' => 'special',
            'image' => 'shops/forest_merchant.png',
        ]);
        
        // 添加森林商店的商品
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['高级生命药水'],
            'price' => 100,
            'stock' => 10,
        ]);
        
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['高级魔法药水'],
            'price' => 120,
            'stock' => 10,
        ]);
        
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['精钢大剑'],
            'price' => 500,
            'stock' => 2,
        ]);
        
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['精钢头盔'],
            'price' => 400,
            'stock' => 2,
        ]);
        
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['精钢战靴'],
            'price' => 300,
            'stock' => 2,
        ]);
        
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['精钢板甲'],
            'price' => 600,
            'stock' => 2,
        ]);
        
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['银戒指'],
            'price' => 200,
            'stock' => 3,
        ]);
        
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['银手镯'],
            'price' => 200,
            'stock' => 3,
        ]);
        
        ShopItem::create([
            'shop_id' => $forestShop->id,
            'item_id' => $itemIds['皮革披风'],
            'price' => 160,
            'stock' => 3,
        ]);
    }
} 