import axios from 'axios';
import useGameStore from '../store/gameStore';
import CollisionService from './collisionService';

// 战斗服务 - 处理战斗相关的API调用和业务逻辑
class CombatService {
    // 处理怪物点击
    async handleMonsterClick(monsterId) {
        const gameStore = useGameStore.getState();
        const monster = gameStore.monsters.find(m => m.id === monsterId);
        
        if (!monster || monster.is_dead) {
            return;
        }
        
        // 同步碰撞检测状态
        CollisionService.setCollisionEnabled(gameStore.isCollisionEnabled);
        
        try {
            // 计算角色和怪物之间的距离
            const character = gameStore.character;
            const characterX = character.position_x || 0;
            const characterY = character.position_y || 0;
            const monsterX = monster.position_x || 0;
            const monsterY = monster.position_y || 0;
            
            const dx = characterX - monsterX;
            const dy = characterY - monsterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 攻击范围设置为120（考虑到角色和怪物的大小各30，加上60的有效攻击距离）
            const attackRange = 120;
            
            // 如果已经在攻击范围内，直接开始攻击
            if (distance <= attackRange) {
                // 开始攻击
                const response = await axios.post('/api/monster/attack', {
                    monster_id: monsterId
                });
                
                if (!response.data.success) {
                    throw new Error(response.data.message || '攻击失败');
                }
                
                // 更新怪物血量
                gameStore.updateMonster(monsterId, { current_hp: response.data.monster.current_hp });
                
                // 如果怪物被击杀
                if (response.data.monster.current_hp <= 0 || response.data.character_died) {
                    if(response.data.character_died){
                        gameStore.addMessage('你已经死亡！', 'error');
                        
                        // 传送到新手村
                        const mapService = await import('./mapService');
                        mapService.default.handleTeleportClick(1);
                    }
                    // 停止自动攻击
                    this.stopAutoAttack();
                    return;
                } else {
                    // 继续自动攻击
                    this.startAutoAttack(monsterId);
                }
                return;
            }
            
            // 如果不在攻击范围内，移动到怪物附近
            const angle = Math.atan2(dy, dx);
            const targetX = monsterX + Math.round(Math.cos(angle) * (attackRange - 30)); // 减去角色半径
            const targetY = monsterY + Math.round(Math.sin(angle) * (attackRange - 30)); // 减去角色半径
            
            const characterService = await import('./characterService');
            await characterService.default.moveCharacter(targetX, targetY);
            
            // 设置自动攻击状态，这样移动完成后会自动开始攻击
            this.startAutoAttack(monsterId);
            
        } catch (error) {
            console.error('攻击怪物失败:', error);
            gameStore.addMessage(`攻击怪物失败: ${error.message}`, 'error');
        }
    }
    
    // 开始自动攻击
    startAutoAttack(monsterId) {
        const gameStore = useGameStore.getState();
        gameStore.setAutoAttack(true, monsterId);
    }
    
    // 停止自动攻击
    stopAutoAttack() {
        const gameStore = useGameStore.getState();
        gameStore.setAutoAttack(false, null);
    }
    
    // 处理怪物被击杀事件
    handleMonsterKilled(data) {
        const gameStore = useGameStore.getState();
        console.log('处理怪物被击杀事件，数据:', data);
        
        // 处理不同格式的数据
        let monsterId, monsterName, killerId, killerName, respawnTime;
        let experienceGained, goldGained, newExperience, newGold, newLevel;
        
        // 处理GameEvent格式的数据
        if (data.type === 'monster.killed' && data.data) {
            console.log(data);
            const eventData = data.data;
            monsterId = eventData.monster_id;
            monsterName = eventData.monster_name;
            killerId = eventData.killer_id;
            killerName = eventData.killer_name;
            experienceGained = eventData.exp_gained;
            goldGained = eventData.gold_gained;
        }

        // 如果是当前玩家击杀的，计算新的经验和金币值
        if (killerId === gameStore.character?.id) {
            newExperience = gameStore.character.exp + experienceGained;
            newGold = gameStore.character.gold + goldGained;
        }
        
        if (!monsterId) {
            console.error('无法解析怪物被击杀数据:', data);
            return;
        }
        
        // 防抖处理：检查该怪物是否已经在短时间内被击杀过
        if (!this.recentKilledMonsters) {
            this.recentKilledMonsters = {};
        }
        
        const now = Date.now();
        const lastKillTime = this.recentKilledMonsters[monsterId] || 0;
        
        // 如果在2秒内已经处理过该怪物的击杀事件，则忽略
        if (now - lastKillTime < 2000) {
            console.log(`忽略重复的怪物击杀事件: ${monsterName}(ID:${monsterId})`);
            return;
        }
        
        // 记录本次处理时间
        this.recentKilledMonsters[monsterId] = now;
        
        // 更新怪物状态
        gameStore.updateMonster(monsterId, { 
            is_dead: true, 
            current_hp: 0,
            hp_percentage: 0,
            respawn_time: respawnTime
        });
        
        // 如果是当前正在自动攻击的怪物，停止自动攻击
        if (gameStore.currentAttackingMonsterId === monsterId) {
            this.stopAutoAttack();
        }
        
        // 如果是自己击杀的，更新经验和金币
        if (killerId === gameStore.character?.id) {
            // 只有当有这些数据时才更新
            const attributesToUpdate = {};
            if (experienceGained !== undefined) {
                attributesToUpdate.exp = gameStore.character.exp + experienceGained;
            }
            if (goldGained !== undefined) {
                attributesToUpdate.gold = gameStore.character.gold + goldGained;
            }
            if (newLevel !== undefined) {
                attributesToUpdate.level = newLevel;
            }
            
            if (Object.keys(attributesToUpdate).length > 0) {
                console.log('更新角色属性:', attributesToUpdate);
                gameStore.updateCharacterAttributes(attributesToUpdate);
            }
            
            // 显示击杀消息
            gameStore.addMessage(`你击杀了 ${monsterName}，获得了 ${experienceGained} 经验和 ${goldGained} 金币！`, 'success');
            
            // 如果升级了
            if (newLevel !== undefined && newLevel > gameStore.character.level) {
                gameStore.addMessage(`恭喜！你升级到了 ${newLevel} 级！`, 'success');
            }
        }
    }
    
    // 处理怪物即将重生事件
    handleMonsterRespawning(data) {
        const gameStore = useGameStore.getState();
        console.log('处理怪物即将重生事件，数据:', data);
        
        // 处理不同格式的数据
        let monsterId, monsterName, respawnTime;
        
        // 处理GameEvent格式的数据
        if (data.type === 'monster.respawning' && data.data) {
            const eventData = data.data;
            monsterId = eventData.monster_id;
            monsterName = eventData.monster_name;
            respawnTime = eventData.respawn_time;
        } else {
            // 直接从data中获取数据
            monsterId = data.monster_id;
            monsterName = data.monster_name;
            respawnTime = data.respawn_time;
        }
        
        if (!monsterName || respawnTime === undefined) {
            console.error('无法解析怪物重生数据:', data);
            return;
        }
        
        // 防抖处理：检查该怪物是否已经在短时间内收到过重生通知
        if (!this.recentRespawningMonsters) {
            this.recentRespawningMonsters = {};
        }
        
        const now = Date.now();
        const lastNotifyTime = this.recentRespawningMonsters[monsterId] || 0;
        
        // 如果在5秒内已经处理过该怪物的重生通知，则忽略
        if (now - lastNotifyTime < 5000) {
            console.log(`忽略重复的怪物即将重生事件: ${monsterName}(ID:${monsterId})`);
            return;
        }
        
        // 记录本次处理时间
        this.recentRespawningMonsters[monsterId] = now;
    }
    
    // 处理怪物重生事件
    handleMonsterRespawned(data) {
        const gameStore = useGameStore.getState();
        console.log('处理怪物重生事件，数据:', data);
        
        // 处理不同格式的数据
        let monsterId, monsterName, hp, currentHp, positionX, positionY;
        
        // 处理GameEvent格式的数据
        if (data.type === 'monster.respawned') {
            const eventData = data.data;
            monsterId = eventData.monster_id;
            monsterName = eventData.monster_name;
            hp = eventData.hp;
            currentHp = eventData.current_hp;
            positionX = eventData.position_x;
            positionY = eventData.position_y;
        } 
        
        // 防抖处理：检查该怪物是否已经在短时间内重生过
        if (!this.recentRespawnedMonsters) {
            this.recentRespawnedMonsters = {};
        }
        
        const now = Date.now();
        const lastRespawnTime = this.recentRespawnedMonsters[monsterId] || 0;
        
        // 如果在5秒内已经处理过该怪物的重生事件，则忽略
        if (now - lastRespawnTime < 5000) {
            console.log(`忽略重复的怪物重生事件: ${monsterName}(ID:${monsterId})`);
            return;
        }
        
        // 记录本次处理时间
        this.recentRespawnedMonsters[monsterId] = now;
        
        // 更新怪物状态
        gameStore.updateMonster(monsterId, { 
            is_dead: false, 
            current_hp: currentHp || hp,
            hp: hp,
            hp_percentage: 100,
            position_x: positionX,
            position_y: positionY,
            respawn_time: null
        });
    }
    
    // 处理角色受伤事件
    handleCharacterDamaged(data) {
        console.log('处理角色受伤事件:', data);
        const gameStore = useGameStore.getState();
        
        // 如果是当前角色受伤
        if (data.character_id === gameStore.character?.id) {
            console.log('当前角色受到伤害:', data.monster_damage);
            
            // 更新角色血量
            const currentHp = gameStore.character.current_hp;
            const newHp = Math.max(0, currentHp - data.monster_damage);
            
            // 强制设置lastHp以触发动画效果
            const updatedCharacter = {
                ...gameStore.character,
                lastHp: currentHp,
                current_hp: newHp,
                max_hp: data.max_hp || gameStore.character.max_hp
            };
            
            // 直接设置角色状态
            gameStore.setCharacter(updatedCharacter);
            
            // 手动触发一个自定义事件，通知UI更新
            window.dispatchEvent(new CustomEvent('character-hp-changed', {
                detail: { oldHp: currentHp, newHp: newHp }
            }));
        } else {
            // 如果是其他玩家受伤，也可以更新其血量显示
            const otherPlayers = gameStore.otherPlayers;
            const playerIndex = otherPlayers.findIndex(p => p.id === data.character_id);
            
            if (playerIndex !== -1) {
                const updatedPlayers = [...otherPlayers];
                updatedPlayers[playerIndex] = {
                    ...updatedPlayers[playerIndex],
                    current_hp: data.current_hp,
                    max_hp: data.max_hp
                };
                
                gameStore.setOtherPlayers(updatedPlayers);
            }
        }
    }

    // 处理战斗更新事件（合并了角色和怪物的伤害信息）
    handleCombatUpdate(data) {
        console.log('处理战斗更新事件:', data);
        const gameStore = useGameStore.getState();
        
        // 处理角色伤害信息
        if (data.character_id === gameStore.character?.id) {
            console.log('当前角色在战斗中:', data);
            
            // 更新角色血量
            const currentHp = gameStore.character.current_hp;
            const newHp = data.character_hp.current_hp;
            
            // 强制设置lastHp以触发动画效果
            const updatedCharacter = {
                ...gameStore.character,
                lastHp: currentHp,
                current_hp: newHp,
                max_hp: data.character_hp.max_hp || gameStore.character.max_hp
            };
            
            // 直接设置角色状态
            gameStore.setCharacter(updatedCharacter);
            
            // 手动触发一个自定义事件，通知UI更新
            window.dispatchEvent(new CustomEvent('character-hp-changed', {
                detail: { oldHp: currentHp, newHp: newHp }
            }));
        } else {
            // 如果是其他玩家在战斗，也可以更新其血量显示
            const otherPlayers = gameStore.otherPlayers;
            const playerIndex = otherPlayers.findIndex(p => p.id === data.character_id);
            
            if (playerIndex !== -1) {
                const updatedPlayers = [...otherPlayers];
                updatedPlayers[playerIndex] = {
                    ...updatedPlayers[playerIndex],
                    current_hp: data.character_hp.current_hp,
                    max_hp: data.character_hp.max_hp
                };
                
                gameStore.setOtherPlayers(updatedPlayers);
            }
        }
        
        // 处理怪物伤害信息
        const monsters = gameStore.monsters;
        const monsterIndex = monsters.findIndex(m => m.id === data.monster_id);
        
        if (monsterIndex !== -1) {
            const updatedMonsters = [...monsters];
            updatedMonsters[monsterIndex] = {
                ...updatedMonsters[monsterIndex],
                current_hp: data.monster_hp.current_hp,
                hp: data.monster_hp.max_hp,
                hp_percentage: data.monster_hp.hp_percentage
            };
            
            gameStore.setMonsters(updatedMonsters);
            
            // 触发怪物血量变化事件
            window.dispatchEvent(new CustomEvent('monster-hp-changed', {
                detail: { 
                    monsterId: data.monster_id,
                    newHp: data.monster_hp.current_hp,
                    maxHp: data.monster_hp.max_hp,
                    percentage: data.monster_hp.hp_percentage
                }
            }));
        }
    }
    
    // 处理角色治疗事件
    handleCharacterHealed(data) {
        console.log('处理角色治疗事件:', data);
        const gameStore = useGameStore.getState();
        
        // 如果是当前角色被治疗
        if (data.character_id === gameStore.character?.id) {
            console.log('当前角色恢复生命值:', data.heal_amount);
            
            // 更新角色血量
            const currentHp = gameStore.character.current_hp;
            const newHp = Math.min(data.max_hp || gameStore.character.max_hp, currentHp + data.heal_amount);
            
            // 强制设置lastHp以触发动画效果
            const updatedCharacter = {
                ...gameStore.character,
                lastHp: currentHp,
                current_hp: newHp,
                max_hp: data.max_hp || gameStore.character.max_hp
            };
            
            // 直接设置角色状态
            gameStore.setCharacter(updatedCharacter);
            
            // 显示治疗消息
            const itemUsed = data.item_used ? `使用 ${data.item_used}` : '';
            gameStore.addMessage(`${itemUsed} 恢复了 ${data.heal_amount} 点生命值`, 'success');
            
            // 手动触发一个自定义事件，通知UI更新
            window.dispatchEvent(new CustomEvent('character-hp-changed', {
                detail: { oldHp: currentHp, newHp: newHp }
            }));
        } else {
            // 如果是其他玩家被治疗，也可以更新其血量显示
            const otherPlayers = gameStore.otherPlayers;
            const playerIndex = otherPlayers.findIndex(p => p.id === data.character_id);
            
            if (playerIndex !== -1) {
                const updatedPlayers = [...otherPlayers];
                updatedPlayers[playerIndex] = {
                    ...updatedPlayers[playerIndex],
                    current_hp: data.current_hp,
                    max_hp: data.max_hp
                };
                
                gameStore.setOtherPlayers(updatedPlayers);
            }
        }
    }
    
    // 处理角色死亡事件
    handleCharacterDied(data) {
        console.log('处理角色死亡事件:', data);
        const gameStore = useGameStore.getState();
        
        // 如果是当前角色死亡
        if (data.character_id === gameStore.character?.id) {
            gameStore.addMessage('你已被击败！', 'error');
            this.stopAutoAttack();
        } else {
            // 如果是其他玩家死亡
            gameStore.addMessage(`玩家 ${data.character_name} 被 ${data.killer_name} 击败了！`, 'info');
        }
    }
    
    // 处理角色复活事件
    handleCharacterRespawned(data) {
        console.log('处理角色复活事件:', data);
        const gameStore = useGameStore.getState();
        
        // 如果是当前角色复活
        if (data.character_id === gameStore.character?.id) {
            // 更新角色位置和血量
            gameStore.updateCharacterAttributes({
                current_hp: data.current_hp,
                max_hp: data.max_hp,
                position_x: data.position_x,
                position_y: data.position_y,
                current_map_id: data.map_id
            });
            
            gameStore.addMessage('你已复活！', 'success');
        } else {
            // 如果是其他玩家复活
            const otherPlayers = gameStore.otherPlayers;
            const playerIndex = otherPlayers.findIndex(p => p.id === data.character_id);
            
            if (playerIndex !== -1) {
                const updatedPlayers = [...otherPlayers];
                updatedPlayers[playerIndex] = {
                    ...updatedPlayers[playerIndex],
                    current_hp: data.current_hp,
                    max_hp: data.max_hp,
                    position_x: data.position_x,
                    position_y: data.position_y
                };
                
                gameStore.setOtherPlayers(updatedPlayers);
                gameStore.addMessage(`玩家 ${data.character_name} 已复活！`, 'info');
            }
        }
    }
}

// 创建单例实例
const combatService = new CombatService();

export default combatService; 