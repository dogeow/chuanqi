<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SkillItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 将技能添加到物品表中，使其可以像其他物品一样掉落
     */
    public function run(): void
    {
        // 获取所有技能
        $skills = DB::table('skills')->get();
        
        // 将技能转换为物品并添加到物品表
        foreach ($skills as $skill) {
            // 根据技能等级要求设置稀有度
            $rarity = 'common';
            if ($skill->level_required >= 15) {
                $rarity = 'epic';
            } elseif ($skill->level_required >= 10) {
                $rarity = 'rare';
            } elseif ($skill->level_required >= 5) {
                $rarity = 'uncommon';
            }
            
            // 设置价格（基于等级和稀有度）
            $buyPrice = $skill->level_required * 100 + $skill->damage * 10;
            $sellPrice = intval($buyPrice / 4);
            
            // 创建物品记录
            DB::table('items')->insert([
                'name' => $skill->name . '技能书',
                'description' => '学习技能：' . $skill->name . '。' . $skill->description,
                'type' => 'skill_book',
                'rarity' => $rarity,
                'level_required' => $skill->level_required,
                'attack_bonus' => 0,
                'defense_bonus' => 0,
                'hp_bonus' => 0,
                'mp_bonus' => 0,
                'buy_price' => $buyPrice,
                'sell_price' => $sellPrice,
                'is_tradable' => 1,
                'is_consumable' => 1,
                'image' => $skill->icon . '📚',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
