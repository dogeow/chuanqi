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

class MapSeeder extends Seeder
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
            'height' => 600,
            'background_image' => 'maps/starter.jpg',
            'spawn_points' => json_encode([
                ['x' => 100, 'y' => 100],
                ['x' => 200, 'y' => 200],
                ['x' => 300, 'y' => 300],
            ]),
            'teleport_points' => json_encode([
                ['x' => 750, 'y' => 100, 'target_map_id' => 2, 'target_x' => 50, 'target_y' => 400, 'name' => '幽暗森林'],
                ['x' => 750, 'y' => 200, 'target_map_id' => 3, 'target_x' => 50, 'target_y' => 200, 'name' => '古老矿洞'],
                ['x' => 750, 'y' => 300, 'target_map_id' => 4, 'target_x' => 50, 'target_y' => 400, 'name' => '炽热沙漠'],
            ]),
        ]);

        // 创建森林地图
        $forestMap = Map::create([
            'name' => '幽暗森林',
            'description' => '茂密的森林，阳光难以穿透树冠，隐藏着各种危险生物。',
            'level_required' => 5,
            'type' => 'normal',
            'width' => 1200,
            'height' => 900,
            'background_image' => 'maps/forest.jpg',
            'spawn_points' => json_encode([
                ['x' => 150, 'y' => 150],
                ['x' => 300, 'y' => 250],
                ['x' => 450, 'y' => 350],
            ]),
            'teleport_points' => json_encode([
                ['x' => 50, 'y' => 400, 'target_map_id' => 1, 'target_x' => 750, 'target_y' => 400, 'name' => '新手村'],
                ['x' => 750, 'y' => 400, 'target_map_id' => 3, 'target_x' => 50, 'target_y' => 400, 'name' => '古老矿洞'],
            ]),
        ]);

        // 创建矿洞地图
        $caveMap = Map::create([
            'name' => '古老矿洞',
            'description' => '昏暗的地下洞窟，曾经是矮人的矿场，现在被各种生物占据。',
            'level_required' => 10,
            'type' => 'dungeon',
            'width' => 1000,
            'height' => 800,
            'background_image' => 'maps/cave.jpg',
            'spawn_points' => json_encode([
                ['x' => 100, 'y' => 200],
                ['x' => 250, 'y' => 300],
                ['x' => 400, 'y' => 400],
            ]),
            'teleport_points' => json_encode([
                ['x' => 50, 'y' => 200, 'target_map_id' => 1, 'target_x' => 750, 'target_y' => 200, 'name' => '新手村'],
                ['x' => 50, 'y' => 400, 'target_map_id' => 2, 'target_x' => 750, 'target_y' => 400, 'name' => '幽暗森林'],
                ['x' => 750, 'y' => 400, 'target_map_id' => 4, 'target_x' => 750, 'target_y' => 200, 'name' => '炽热沙漠'],
            ]),
        ]);

        // 创建沙漠地图
        $desertMap = Map::create([
            'name' => '炽热沙漠',
            'description' => '一片荒芜的沙漠，白天烈日炎炎，夜晚寒冷刺骨，隐藏着远古的遗迹。',
            'level_required' => 15,
            'type' => 'normal',
            'width' => 1400,
            'height' => 1000,
            'background_image' => 'maps/desert.jpg',
            'spawn_points' => json_encode([
                ['x' => 200, 'y' => 200],
                ['x' => 400, 'y' => 300],
                ['x' => 600, 'y' => 400],
            ]),
            'teleport_points' => json_encode([
                ['x' => 50, 'y' => 400, 'target_map_id' => 1, 'target_x' => 750, 'target_y' => 500, 'name' => '新手村'],
                ['x' => 750, 'y' => 200, 'target_map_id' => 3, 'target_x' => 750, 'target_y' => 400, 'name' => '古老矿洞'],
            ]),
        ]);
    }
} 