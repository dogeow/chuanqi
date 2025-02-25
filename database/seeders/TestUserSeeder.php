<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Character;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // 创建测试用户
        $user = User::create([
            'name' => '测试玩家',
            'email' => 'test2@example.com',
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
            'current_map_id' => 1,
            'position_x' => 100,
            'position_y' => 100,
        ]);
    }
} 