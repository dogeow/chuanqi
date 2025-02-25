<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Character;
use App\Models\Map;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // 获取第一个地图（新手村）
        $starterMap = Map::first();
        
        if (!$starterMap) {
            $this->command->error('没有找到地图数据，请先运行 GameSeeder');
            return;
        }
        
        // 创建测试用户
        $user = User::create([
            'name' => '测试玩家',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
            'gold' => 1000,
        ]);

        // 创建角色
        Character::create([
            'user_id' => $user->id,
            'name' => '测试角色',
            'level' => 1,
            'exp' => 0,
            'max_hp' => 100,
            'current_hp' => 100,
            'max_mp' => 50,
            'current_mp' => 50,
            'attack' => 10,
            'defense' => 5,
            'current_map_id' => $starterMap->id,
            'position_x' => 100,
            'position_y' => 100,
        ]);
        
        // 创建第二个测试用户
        $user2 = User::create([
            'name' => '测试玩家2',
            'email' => 'test2@example.com',
            'password' => Hash::make('password'),
            'gold' => 1000,
        ]);

        // 创建第二个角色
        Character::create([
            'user_id' => $user2->id,
            'name' => '测试角色2',
            'level' => 1,
            'exp' => 0,
            'max_hp' => 100,
            'current_hp' => 100,
            'max_mp' => 50,
            'current_mp' => 50,
            'attack' => 10,
            'defense' => 5,
            'current_map_id' => $starterMap->id,
            'position_x' => 200,
            'position_y' => 200,
        ]);
    }
} 