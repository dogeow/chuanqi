<?php

namespace App\Http\Controllers;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\Skill;
use App\Models\CharacterSkill;
use App\Models\Monster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SkillController extends Controller
{
    /**
     * 获取角色技能列表
     */
    public function getSkills()
    {
        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 获取角色已学习的技能
        $characterSkills = CharacterSkill::where('character_id', $character->id)
            ->with('skill')
            ->get();

        return response()->json([
            'success' => true,
            'skills' => $characterSkills
        ]);
    }

    /**
     * 学习新技能
     */
    public function learnSkill(Request $request)
    {
        $request->validate([
            'skill_id' => 'required|exists:skills,id',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        $skill = Skill::find($request->skill_id);

        // 检查角色等级是否满足要求
        if ($character->level < $skill->level_required) {
            return response()->json([
                'success' => false,
                'message' => '角色等级不足，无法学习该技能'
            ], 400);
        }

        // 检查是否已经学习了该技能
        $existingSkill = CharacterSkill::where('character_id', $character->id)
            ->where('skill_id', $skill->id)
            ->first();

        if ($existingSkill) {
            return response()->json([
                'success' => false,
                'message' => '已经学习了该技能'
            ], 400);
        }

        // 检查金币是否足够
        if ($character->gold < $skill->cost) {
            return response()->json([
                'success' => false,
                'message' => '金币不足，无法学习该技能'
            ], 400);
        }

        // 扣除金币
        $character->gold -= $skill->cost;
        $character->save();

        // 学习技能
        $characterSkill = new CharacterSkill();
        $characterSkill->character_id = $character->id;
        $characterSkill->skill_id = $skill->id;
        $characterSkill->level = 1;
        $characterSkill->save();

        return response()->json([
            'success' => true,
            'message' => '成功学习技能',
            'skill' => $characterSkill->load('skill'),
            'character' => $character
        ]);
    }

    /**
     * 使用技能攻击怪物
     */
    public function useSkill(Request $request)
    {
        $request->validate([
            'skill_id' => 'required|exists:skills,id',
            'monster_id' => 'required|exists:monsters,id',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 检查角色是否学习了该技能
        $characterSkill = CharacterSkill::where('character_id', $character->id)
            ->where('skill_id', $request->skill_id)
            ->with('skill')
            ->first();

        if (!$characterSkill) {
            return response()->json([
                'success' => false,
                'message' => '未学习该技能'
            ], 400);
        }

        $skill = $characterSkill->skill;

        // 检查魔法值是否足够
        if ($character->current_mp < $skill->mp_cost) {
            return response()->json([
                'success' => false,
                'message' => '魔法值不足，无法使用该技能'
            ], 400);
        }

        $monster = Monster::find($request->monster_id);
        
        // 检查怪物是否在同一地图
        if ($monster->map_id != $character->map_id) {
            return response()->json([
                'success' => false,
                'message' => '怪物不在当前地图'
            ], 400);
        }

        // 扣除魔法值
        $character->current_mp -= $skill->mp_cost;
        $character->save();

        // 计算技能伤害（基础伤害 + 技能等级加成）
        $baseDamage = $skill->base_damage + ($characterSkill->level * $skill->level_damage_bonus);
        $damage = rand($baseDamage * 0.9, $baseDamage * 1.1); // 伤害浮动10%
        $monster->current_hp -= $damage;

        $result = [
            'success' => true,
            'damage' => $damage,
            'monster' => $monster,
            'skill_used' => $skill->name,
            'character' => $character
        ];

        // 检查怪物是否死亡
        if ($monster->current_hp <= 0) {
            $monster->current_hp = 0;
            $monster->save();
            
            // 计算获得的经验和金币
            $expGained = $monster->exp_reward;
            $goldGained = $monster->gold_reward;
            
            $character->exp += $expGained;
            $character->gold += $goldGained;
            
            // 检查是否升级
            $leveledUp = false;
            while ($character->exp >= $character->exp_to_level) {
                $character->level += 1;
                $character->exp -= $character->exp_to_level;
                $character->exp_to_level = $character->level * 100; // 简单的升级公式
                $character->max_hp += 10;
                $character->current_hp = $character->max_hp;
                $character->max_mp += 5;
                $character->current_mp = $character->max_mp;
                $character->attack_min += 2;
                $character->attack_max += 3;
                $leveledUp = true;
            }
            
            $character->save();
            
            $result['monster_killed'] = true;
            $result['exp_gained'] = $expGained;
            $result['gold_gained'] = $goldGained;
            $result['character'] = $character;
            
            if ($leveledUp) {
                $result['leveled_up'] = true;
                $result['new_level'] = $character->level;
            }
            
            // 广播怪物死亡事件
            event(new GameEvent('monster.killed', [
                'monster_id' => $monster->id,
                'monster_name' => $monster->name,
                'killer_id' => $character->id,
                'killer_name' => $character->name,
                'skill_used' => $skill->name
            ], $character->map_id));
            
            // 怪物重生逻辑（可以通过队列延迟执行）
            // 这里简单处理，直接重置怪物生命值
            $monster->current_hp = $monster->max_hp;
            $monster->save();
        } else {
            $monster->save();
            
            // 广播怪物受伤事件
            event(new GameEvent('monster.damaged', [
                'monster_id' => $monster->id,
                'monster_name' => $monster->name,
                'damage' => $damage,
                'attacker_id' => $character->id,
                'attacker_name' => $character->name,
                'skill_used' => $skill->name,
                'current_hp' => $monster->current_hp,
                'max_hp' => $monster->max_hp
            ], $character->map_id));
        }
        
        return response()->json($result);
    }

    /**
     * 升级技能
     */
    public function upgradeSkill(Request $request)
    {
        $request->validate([
            'skill_id' => 'required|exists:skills,id',
        ]);

        $user = Auth::user();
        $character = Character::where('user_id', $user->id)->first();

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => '角色不存在'
            ], 404);
        }

        // 检查角色是否学习了该技能
        $characterSkill = CharacterSkill::where('character_id', $character->id)
            ->where('skill_id', $request->skill_id)
            ->with('skill')
            ->first();

        if (!$characterSkill) {
            return response()->json([
                'success' => false,
                'message' => '未学习该技能'
            ], 400);
        }

        $skill = $characterSkill->skill;

        // 检查技能是否已达到最高等级
        if ($characterSkill->level >= $skill->max_level) {
            return response()->json([
                'success' => false,
                'message' => '技能已达到最高等级'
            ], 400);
        }

        // 计算升级所需金币（简单公式：基础费用 * 当前等级）
        $upgradeCost = $skill->upgrade_cost * $characterSkill->level;

        // 检查金币是否足够
        if ($character->gold < $upgradeCost) {
            return response()->json([
                'success' => false,
                'message' => '金币不足，无法升级技能'
            ], 400);
        }

        // 扣除金币
        $character->gold -= $upgradeCost;
        $character->save();

        // 升级技能
        $characterSkill->level += 1;
        $characterSkill->save();

        return response()->json([
            'success' => true,
            'message' => '成功升级技能',
            'skill' => $characterSkill->fresh()->load('skill'),
            'character' => $character
        ]);
    }
}
