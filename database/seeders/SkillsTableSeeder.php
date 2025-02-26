<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SkillsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 战士技能
        $warriorSkills = [
            [
                'name' => '猛击',
                'description' => '用力猛击敌人，造成120%的物理伤害',
                'cooldown' => 3,
                'mp_cost' => 5,
                'damage' => 20,
                'effect_type' => 'damage',
                'effect_value' => 0,
                'effect_duration' => 0,
                'level_required' => 1,
                'icon' => '⚔️',
            ],
            [
                'name' => '旋风斩',
                'description' => '旋转武器攻击周围敌人，造成100%的物理伤害',
                'cooldown' => 8,
                'mp_cost' => 15,
                'damage' => 30,
                'effect_type' => 'damage',
                'effect_value' => 0,
                'effect_duration' => 0,
                'level_required' => 5,
                'icon' => '🌀',
            ],
            [
                'name' => '盾牌格挡',
                'description' => '举起盾牌，增加30%的防御力，持续10秒',
                'cooldown' => 15,
                'mp_cost' => 10,
                'damage' => 0,
                'effect_type' => 'buff',
                'effect_value' => 30,
                'effect_duration' => 10,
                'level_required' => 8,
                'icon' => '🛡️',
            ],
            [
                'name' => '破甲一击',
                'description' => '攻击敌人的弱点，降低敌人20%的防御力，持续5秒',
                'cooldown' => 12,
                'mp_cost' => 20,
                'damage' => 25,
                'effect_type' => 'debuff',
                'effect_value' => -20,
                'effect_duration' => 5,
                'level_required' => 12,
                'icon' => '💥',
            ],
            [
                'name' => '狂暴',
                'description' => '进入狂暴状态，增加50%的攻击力，但降低20%的防御力，持续15秒',
                'cooldown' => 30,
                'mp_cost' => 30,
                'damage' => 0,
                'effect_type' => 'buff',
                'effect_value' => 50,
                'effect_duration' => 15,
                'level_required' => 15,
                'icon' => '😡',
            ],
            [
                'name' => '致命打击',
                'description' => '对敌人造成200%的物理伤害，有20%几率造成暴击',
                'cooldown' => 20,
                'mp_cost' => 35,
                'damage' => 80,
                'effect_type' => 'damage',
                'effect_value' => 0,
                'effect_duration' => 0,
                'level_required' => 18,
                'icon' => '☠️',
            ],
        ];

        // 法师技能
        $mageSkills = [
            [
                'name' => '火球术',
                'description' => '发射一个火球攻击敌人，造成120%的魔法伤害',
                'cooldown' => 3,
                'mp_cost' => 10,
                'damage' => 25,
                'effect_type' => 'damage',
                'effect_value' => 0,
                'effect_duration' => 0,
                'level_required' => 1,
                'icon' => '🔥',
            ],
            [
                'name' => '冰冻术',
                'description' => '冻结敌人，造成80%的魔法伤害并减缓敌人30%的移动速度，持续3秒',
                'cooldown' => 8,
                'mp_cost' => 15,
                'damage' => 20,
                'effect_type' => 'debuff',
                'effect_value' => -30,
                'effect_duration' => 3,
                'level_required' => 5,
                'icon' => '❄️',
            ],
            [
                'name' => '魔法护盾',
                'description' => '创造一个魔法护盾，吸收下一次受到的伤害，持续10秒',
                'cooldown' => 15,
                'mp_cost' => 20,
                'damage' => 0,
                'effect_type' => 'buff',
                'effect_value' => 50,
                'effect_duration' => 10,
                'level_required' => 8,
                'icon' => '🔮',
            ],
            [
                'name' => '闪电链',
                'description' => '释放一道闪电，可以连续攻击多个敌人，每次跳跃伤害降低20%',
                'cooldown' => 12,
                'mp_cost' => 25,
                'damage' => 40,
                'effect_type' => 'damage',
                'effect_value' => 0,
                'effect_duration' => 0,
                'level_required' => 12,
                'icon' => '⚡',
            ],
            [
                'name' => '魔力涌动',
                'description' => '短时间内魔法消耗减少50%，持续15秒',
                'cooldown' => 30,
                'mp_cost' => 30,
                'damage' => 0,
                'effect_type' => 'buff',
                'effect_value' => 50,
                'effect_duration' => 15,
                'level_required' => 15,
                'icon' => '✨',
            ],
            [
                'name' => '陨石术',
                'description' => '召唤陨石从天而降，对敌人造成250%的魔法伤害',
                'cooldown' => 25,
                'mp_cost' => 50,
                'damage' => 100,
                'effect_type' => 'damage',
                'effect_value' => 0,
                'effect_duration' => 0,
                'level_required' => 18,
                'icon' => '☄️',
            ],
        ];

        // 通用技能
        $commonSkills = [
            [
                'name' => '治疗术',
                'description' => '恢复自身50点生命值',
                'cooldown' => 10,
                'mp_cost' => 15,
                'damage' => 0,
                'effect_type' => 'heal',
                'effect_value' => 50,
                'effect_duration' => 0,
                'level_required' => 3,
                'icon' => '💚',
            ],
            [
                'name' => '疾跑',
                'description' => '增加30%的移动速度，持续5秒',
                'cooldown' => 15,
                'mp_cost' => 10,
                'damage' => 0,
                'effect_type' => 'buff',
                'effect_value' => 30,
                'effect_duration' => 5,
                'level_required' => 5,
                'icon' => '🏃',
            ],
            [
                'name' => '隐身术',
                'description' => '进入隐身状态，敌人无法发现你，持续10秒或直到攻击',
                'cooldown' => 30,
                'mp_cost' => 25,
                'damage' => 0,
                'effect_type' => 'buff',
                'effect_value' => 0,
                'effect_duration' => 10,
                'level_required' => 10,
                'icon' => '👻',
            ],
            [
                'name' => '生命汲取',
                'description' => '对敌人造成80%的魔法伤害，并将伤害的30%转化为自身生命值',
                'cooldown' => 15,
                'mp_cost' => 20,
                'damage' => 30,
                'effect_type' => 'damage',
                'effect_value' => 30,
                'effect_duration' => 0,
                'level_required' => 12,
                'icon' => '💉',
            ],
            [
                'name' => '嘲讽',
                'description' => '嘲讽敌人，使其攻击自己，持续3秒',
                'cooldown' => 20,
                'mp_cost' => 15,
                'damage' => 0,
                'effect_type' => 'debuff',
                'effect_value' => 0,
                'effect_duration' => 3,
                'level_required' => 8,
                'icon' => '😤',
            ],
            [
                'name' => '反弹护盾',
                'description' => '创造一个反弹护盾，将受到伤害的50%反弹给攻击者，持续8秒',
                'cooldown' => 25,
                'mp_cost' => 30,
                'damage' => 0,
                'effect_type' => 'buff',
                'effect_value' => 50,
                'effect_duration' => 8,
                'level_required' => 15,
                'icon' => '🔄',
            ],
        ];

        // 合并所有技能
        $allSkills = array_merge(
            $warriorSkills,
            $mageSkills,
            $commonSkills
        );

        // 插入数据库
        foreach ($allSkills as $skill) {
            DB::table('skills')->insert(array_merge($skill, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}
