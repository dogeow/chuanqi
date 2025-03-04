<?php

namespace App\Services;

use App\Events\GameEvent;
use App\Models\Character;
use App\Models\Monster;
use Illuminate\Support\Facades\Log;

class CombatService
{
    /**
     * 处理角色攻击怪物
     *
     * @param Character $character 攻击的角色
     * @param Monster $monster 被攻击的怪物
     * @return array 战斗结果
     */
    public function characterAttackMonster(Character $character, Monster $monster)
    {
        // 初始化结果数组
        $result = [
            'success' => true,
            'monster' => $monster,
        ];

        // 计算角色对怪物的伤害
        $damage = rand($character->getAttackMinAttribute(), $character->getAttackMaxAttribute());
        $monster->current_hp -= $damage;

        // 确保怪物生命值不会小于0
        if ($monster->current_hp < 0) {
            $monster->current_hp = 0;
        }

        $result['damage'] = $damage;
        
        // 怪物反击（如果怪物没有死亡）
        if ($monster->current_hp > 0) {
            $result = array_merge($result, $this->monsterCounterAttack($monster, $character));
        }

        // 检查怪物是否死亡
        if ($monster->current_hp <= 0) {
            $result = array_merge($result, $this->handleMonsterDeath($monster, $character));
        } else {
            $monster->save();
            
            // 广播怪物受伤事件
            $this->broadcastMonsterDamaged($monster, $character, $damage);
        }
        
        // 重新获取最新的怪物信息
        $monster = Monster::find($monster->id);
        
        // 确保返回的怪物数据包含hp_percentage
        $monster->hp_percentage = ($monster->current_hp / $monster->hp) * 100;
        
        $result['monster'] = $monster;
        
        return $result;
    }

    /**
     * 处理怪物反击
     *
     * @param Monster $monster 反击的怪物
     * @param Character $character 被反击的角色
     * @return array 反击结果
     */
    private function monsterCounterAttack(Monster $monster, Character $character)
    {
        $result = [];

        // 计算怪物对角色的伤害
        $monsterDamage = max(1, round($monster->attack * (1 - $character->defense / 100)));
        $character->current_hp -= $monsterDamage;
        
        // 确保角色生命值不会小于0
        if ($character->current_hp < 0) {
            $character->current_hp = 0;
        }
        
        $character->save();
        
        // 添加怪物反击信息到结果
        $result['monster_damage'] = $monsterDamage;
        $result['character'] = $character;
        
        // 广播角色受伤事件
        $this->broadcastCharacterDamaged($character, $monster, $monsterDamage);
        
        // 检查角色是否死亡
        if ($character->current_hp <= 0) {
            $result = array_merge($result, $this->handleCharacterDeath($character, $monster));
        }

        return $result;
    }

    /**
     * 处理角色死亡
     *
     * @param Character $character 死亡的角色
     * @param Monster $monster 击杀角色的怪物
     * @return array 处理结果
     */
    private function handleCharacterDeath(Character $character, Monster $monster)
    {
        $result = [
            'character_died' => true
        ];
        
        // 角色死亡处理（可以在这里添加复活逻辑）
        // 例如：将角色传送回新手村，恢复一定生命值等
        $character->current_hp = max(1, round($character->max_hp * 0.1)); // 恢复10%生命值
        $character->current_map_id = 1; // 传送回新手村
        $character->position_x = 100;
        $character->position_y = 100;
        $character->save();
        
        $result['character'] = $character;
        $result['respawn_message'] = '您已被击败，已传送回新手村并恢复少量生命值';
        
        // 广播角色死亡和复活事件
        $this->broadcastCharacterDied($character, $monster);
        $this->broadcastCharacterRespawned($character);

        return $result;
    }

    /**
     * 处理怪物死亡
     *
     * @param Monster $monster 死亡的怪物
     * @param Character $character 击杀怪物的角色
     * @return array 处理结果
     */
    private function handleMonsterDeath(Monster $monster, Character $character)
    {
        $monster->current_hp = 0;
        $monster->save();
        
        $result = [
            'monster_killed' => true
        ];
        
        // 计算获得的经验和金币
        $expGained = $monster->exp_reward;
        $goldGained = $monster->gold_reward;
        
        $character->exp += $expGained;
        $character->gold += $goldGained;
        
        // 检查是否升级
        $leveledUp = $this->checkLevelUp($character);
        
        $character->save();
        
        $result['exp_gained'] = $expGained;
        $result['gold_gained'] = $goldGained;
        $result['character'] = $character;
        
        if ($leveledUp) {
            $result['leveled_up'] = true;
            $result['new_level'] = $character->level;
        }
        
        // 处理物品掉落
        $itemDropService = new ItemDropService();
        $droppedItems = $itemDropService->processMonsterDrop($monster, $character);
        
        if (!empty($droppedItems)) {
            $result['dropped_items'] = $droppedItems;
            
            // 构建掉落物品的消息
            $dropMessage = '获得了物品：';
            foreach ($droppedItems as $item) {
                $dropMessage .= $item['item_name'] . ' x' . $item['quantity'] . '、';
            }
            $dropMessage = rtrim($dropMessage, '、');
            $result['drop_message'] = $dropMessage;
            
            // 广播物品掉落事件
            $this->broadcastItemDropped($character, $monster, $droppedItems);
        }
        
        // 广播怪物死亡事件
        $this->broadcastMonsterKilled($monster, $character, $expGained, $goldGained);
        
        // 处理怪物重生
        $this->handleMonsterRespawn($monster, $character);
        
        return $result;
    }

    /**
     * 检查角色是否升级
     *
     * @param Character $character 角色
     * @return bool 是否升级
     */
    private function checkLevelUp(Character $character)
    {
        $leveledUp = false;
        while ($character->exp >= $character->getExpToLevelAttribute()) {
            $character->level += 1;
            $character->exp -= $character->getExpToLevelAttribute();
            // 确保经验值不会变为负数
            if ($character->exp < 0) {
                $character->exp = 0;
            }
            $character->max_hp += 10;
            $character->current_hp = $character->max_hp;
            $character->attack += 2;
            $leveledUp = true;
        }
        
        return $leveledUp;
    }

    /**
     * 处理怪物重生
     *
     * @param Monster $monster 死亡的怪物
     * @param Character $character 击杀怪物的角色
     * @return void
     */
    private function handleMonsterRespawn(Monster $monster, Character $character)
    {
        // 设置一个临时标记，表示怪物已死亡，前端可以根据这个标记隐藏怪物
        $monster->is_dead = true;
        $monster->save();
        
        // 使用队列延迟执行怪物重生
        // 这里我们使用简单的方式，通过广播一个事件通知前端怪物重生
        $respawnTime = $monster->respawn_time ?? 60; // 默认60秒重生
        
        // 广播怪物即将重生的消息
        if($monster->is_boss){
            $this->broadcastMonsterRespawning($monster, $respawnTime);
        }
        
        // 使用队列延迟执行怪物重生
        dispatch(function() use ($monster) {
            // 重置怪物生命值
            $monster->current_hp = $monster->hp;
            $monster->is_dead = false;
            $monster->save();
            
            // 广播怪物重生事件
            $this->broadcastMonsterRespawned($monster);
        })->delay(now()->addSeconds($respawnTime));
    }

    /**
     * 广播角色受伤事件
     */
    private function broadcastCharacterDamaged(Character $character, Monster $monster, $damage)
    {
        event(new GameEvent('character.damaged', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'attacker_id' => $monster->id,
            'attacker_name' => $monster->name,
            'character_damage' => 0, // 角色对怪物的伤害在其他地方广播
            'monster_damage' => $damage,
            'current_hp' => $character->current_hp,
            'max_hp' => $character->max_hp,
            'hp_percentage' => ($character->current_hp / $character->max_hp) * 100,
            'is_heal' => false
        ], $character->current_map_id));
    }

    /**
     * 广播角色死亡事件
     */
    private function broadcastCharacterDied(Character $character, Monster $monster)
    {
        event(new GameEvent('character.died', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'killer_id' => $monster->id,
            'killer_name' => $monster->name
        ], $character->current_map_id));
    }

    /**
     * 广播角色复活事件
     */
    private function broadcastCharacterRespawned(Character $character)
    {
        event(new GameEvent('character.respawned', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'current_hp' => $character->current_hp,
            'max_hp' => $character->max_hp,
            'hp_percentage' => ($character->current_hp / $character->max_hp) * 100,
            'position_x' => $character->position_x,
            'position_y' => $character->position_y,
            'map_id' => $character->current_map_id
        ], $character->current_map_id));
    }

    /**
     * 广播怪物受伤事件
     */
    private function broadcastMonsterDamaged(Monster $monster, Character $character, $damage)
    {
        event(new GameEvent('monster.damaged', [
            'monster_id' => $monster->id,
            'monster_name' => $monster->name,
            'attacker_id' => $character->id,
            'attacker_name' => $character->name,
            'damage' => $damage,
            'current_hp' => $monster->current_hp,
            'hp_percentage' => ($monster->current_hp / $monster->hp) * 100,
            'is_dead' => false
        ], $monster->map_id));
    }

    /**
     * 广播怪物死亡事件
     */
    private function broadcastMonsterKilled(Monster $monster, Character $character, $expGained, $goldGained)
    {
        event(new GameEvent('monster.killed', [
            'monster_id' => $monster->id,
            'monster_name' => $monster->name,
            'killer_id' => $character->id,
            'killer_name' => $character->name,
            'exp_gained' => $expGained,
            'gold_gained' => $goldGained
        ], $monster->map_id));
    }

    /**
     * 广播怪物即将重生事件
     */
    private function broadcastMonsterRespawning(Monster $monster, $respawnTime)
    {
        event(new GameEvent('monster.respawning', [
            'monster_id' => $monster->id,
            'monster_name' => $monster->name,
            'respawn_time' => $respawnTime
        ], $monster->map_id));
    }

    /**
     * 广播怪物重生事件
     */
    private function broadcastMonsterRespawned(Monster $monster)
    {
        event(new GameEvent('monster.respawned', [
            'monster_id' => $monster->id,
            'monster_name' => $monster->name,
            'hp' => $monster->hp,
            'current_hp' => $monster->current_hp,
            'hp_percentage' => 100, // 重生时血量为满
            'position_x' => $monster->position_x,
            'position_y' => $monster->position_y,
            'is_dead' => false
        ], $monster->map_id));
    }

    /**
     * 广播物品掉落事件
     */
    private function broadcastItemDropped(Character $character, Monster $monster, array $items)
    {
        event(new GameEvent('item.dropped', [
            'character_id' => $character->id,
            'character_name' => $character->name,
            'monster_id' => $monster->id,
            'monster_name' => $monster->name,
            'items' => $items
        ], $character->current_map_id));
    }
}