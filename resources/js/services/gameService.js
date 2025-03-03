import axios from 'axios';
import useGameStore from '../store/gameStore';
import CollisionService from './collisionService';

// 游戏服务 - 处理游戏相关的API调用和业务逻辑
class GameService {
    // 加载游戏数据
    async loadGameData() {
        const gameStore = useGameStore.getState();
        
        // 如果已经开始加载，则不再重复加载
        if (gameStore.isLoadingStarted) {
            console.log('游戏数据已经在加载中，跳过重复加载');
            return;
        }
        
        // 标记加载已开始
        gameStore.setLoadingStarted(true);
        
        try {
            console.log('开始加载游戏数据...');
            gameStore.setLoading(true);
            
            // 获取角色信息
            const characterResponse = await axios.get('/api/character');
            if (!characterResponse.data.success) {
                throw new Error(characterResponse.data.message || '获取角色数据失败');
            }
            
            console.log('角色数据加载成功:', characterResponse.data);
            const characterData = characterResponse.data.character;
            
            // 确保同时设置x和y属性
            if (characterData.position_x !== undefined && characterData.position_y !== undefined) {
                characterData.x = characterData.position_x;
                characterData.y = characterData.position_y;
            }
            gameStore.setCharacter(characterData);
            
            // 检查角色的地图ID是否存在
            if (!characterData.current_map_id) {
                console.error('角色没有地图ID，使用默认地图ID 1');
                characterData.current_map_id = 1; // 设置默认地图ID
                gameStore.addMessage('无法获取角色当前地图，使用默认地图', 'warning');
            }
            
            console.log(`正在加载地图数据，地图ID: ${characterData.current_map_id}`);
            
            // 获取地图信息
            const mapResponse = await axios.get(`/api/map/${characterData.current_map_id}`);
            if (!mapResponse.data.success) {
                throw new Error(mapResponse.data.message || '获取地图数据失败');
            }
            
            console.log('地图数据加载成功:', mapResponse.data);
            const mapData = mapResponse.data.map;
            gameStore.setGameData(mapResponse.data);
            
            // 获取背包信息
            const inventoryResponse = await axios.get('/api/inventory');
            if (!inventoryResponse.data.success) {
                throw new Error(inventoryResponse.data.message || '获取背包数据失败');
            }
            
            console.log('背包数据加载成功:', inventoryResponse.data);
            gameStore.setInventory(inventoryResponse.data.inventory || []);
            
            // 初始化WebSocket连接
            console.log('准备初始化WebSocket连接...');
            
            if (!window.Echo) {
                console.error('Echo未初始化，无法建立WebSocket连接');
            } else {
                console.log('Echo已初始化，准备连接到地图频道');
                this.initWebSocketWithData(characterData, mapData);
            }
            
            gameStore.addMessage('游戏数据加载完成！', 'success');
        } catch (error) {
            console.error('加载游戏数据失败:', error);
            gameStore.addMessage(`加载游戏数据失败: ${error.message}`, 'error');
        } finally {
            gameStore.setLoading(false);
        }
    }
    
    // 初始化WebSocket连接（带数据）
    initWebSocketWithData(characterData, mapData) {
        const gameStore = useGameStore.getState();
        
        console.log('initWebSocketWithData被调用，参数:', { characterData, mapData });
        
        // 验证必要参数
        if (!characterData || !characterData.id) {
            console.error('角色数据无效，无法初始化WebSocket连接', characterData);
            gameStore.addMessage('无法初始化实时通信，部分功能可能不可用', 'error');
            return false;
        }
        
        if (!window.Echo) {
            console.error('Echo未初始化，无法建立WebSocket连接');
            gameStore.addMessage('无法初始化实时通信，部分功能可能不可用', 'error');
            return false;
        }
        
        if (!mapData || !mapData.id) {
            console.error('地图数据无效，无法初始化WebSocket连接', mapData);
            gameStore.addMessage('无法连接到游戏服务器，部分功能可能不可用', 'error');
            return false;
        }
        
        // 获取当前地图ID
        const mapId = mapData.id;
        
        console.log(`正在连接到地图频道: map.${mapId}`);
        
        try {
            // 检查是否已经订阅了该频道
            const channelName = `presence-map.${mapId}`;
            const existingChannel = window.Echo.connector.channels[channelName];
            
            if (existingChannel) {
                console.log(`已经订阅了地图频道 map.${mapId}，跳过重复订阅`);
                return true; // 已经连接，返回成功
            }
            
            // 如果有其他地图频道的连接，先离开
            Object.keys(window.Echo.connector.channels).forEach(channel => {
                if (channel.startsWith('presence-map.') && channel !== channelName) {
                    const oldMapId = channel.replace('presence-map.', '');
                    console.log(`离开旧地图频道: map.${oldMapId}`);
                    window.Echo.leave(`map.${oldMapId}`);
                }
            });
            
            // 订阅地图频道
            window.Echo.join(`map.${mapId}`)
                .here((users) => {
                    console.log('当前在线用户:', users);
                })
                .joining((user) => {
                    console.log('用户加入:', user);
                })
                .leaving((user) => {
                    console.log('用户离开:', user);
                })
                .listen('CharacterMoved', (data) => {
                    console.log('收到CharacterMoved事件:', data);
                    this.handleCharacterMove(data);
                })
                .listen('.game.event', (event) => {
                    // 注意这里使用了.game.event而不是game.event，因为Laravel Echo会自动添加.前缀
                    console.log('收到.game.event事件:', event);
                    
                    // 解析事件数据
                    let eventData;
                    try {
                        // 如果data是字符串，尝试解析JSON
                        if (typeof event.data === 'string') {
                            eventData = JSON.parse(event.data);
                        } else {
                            eventData = event;
                        }
                        console.log('解析后的事件数据:', eventData);
                    } catch (error) {
                        console.error('解析game.event数据失败:', error, event);
                        eventData = event;
                    }
                    
                    // 处理不同类型的游戏事件
                    const eventHandlers = {
                        'character.move': () => this.handleCharacterMove(eventData),
                        'monster.respawning': () => this.handleMonsterRespawning(eventData),
                        'monster.respawned': () => this.handleMonsterRespawned(eventData),
                        'monster.killed': () => this.handleMonsterKilled(eventData),
                        'character.damaged': () => this.handleCharacterDamaged(eventData.data),
                        'character.healed': () => this.handleCharacterHealed(eventData.data),
                        'character.died': () => this.handleCharacterDied(eventData.data),
                        'character.respawned': () => this.handleCharacterRespawned(eventData.data)
                    };
                    
                    const eventType = eventData.type;
                    if (eventHandlers[eventType]) {
                        console.log(`处理${eventType}事件:`, eventData);
                        eventHandlers[eventType]();
                    } else {
                        console.log('未处理的game.event类型:', eventType, eventData);
                    }
                })
                .listen('CharacterEntered', (data) => {
                    console.log('收到CharacterEntered事件:', data);
                    this.handleCharacterEnter(data);
                })
                .listen('CharacterLeft', (data) => {
                    console.log('收到CharacterLeft事件:', data);
                    this.handleCharacterLeave(data);
                })
                .error((error) => {
                    console.error('WebSocket连接错误:', error);
                    gameStore.addMessage('与游戏服务器的连接出现问题，请刷新页面', 'error');
                });
                
            console.log(`已成功连接到地图频道: map.${mapId}`);
            return true;
        } catch (error) {
            console.error('初始化WebSocket连接失败:', error);
            gameStore.addMessage('无法连接到游戏服务器，请检查网络连接', 'error');
            return false;
        }
    }
    
    // 处理角色移动事件
    handleCharacterMove(data) {
        const gameStore = useGameStore.getState();
        console.log('gameService处理角色移动事件，原始数据:', data);
        
        // 处理不同格式的事件数据
        let characterId, positionX, positionY, characterName;
        
        try {
            // 提取角色移动数据
            if (data.type === 'character.move' && data.data?.character) {
                console.log('处理game.event类型的角色移动事件');
                const { id, position_x, position_y, name } = data.data.character;
                characterId = id;
                positionX = position_x;
                positionY = position_y;
                characterName = name;
            } 
            // 处理CharacterMoved事件
            else if (data.character) {
                console.log('处理CharacterMoved类型的角色移动事件');
                const { id, position_x, position_y, name } = data.character;
                characterId = id;
                positionX = position_x;
                positionY = position_y;
                characterName = name;
            }
            // 处理简单格式的事件
            else if (data.character_id) {
                console.log('处理简单格式的角色移动事件');
                characterId = data.character_id;
                positionX = data.position_x;
                positionY = data.position_y;
                characterName = data.character_name || `玩家${characterId}`;
            }
            // 尝试解析字符串格式的数据
            else if (typeof data === 'string') {
                console.log('尝试解析字符串格式的事件数据');
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.type === 'character.move' && parsedData.data?.character) {
                        const { id, position_x, position_y, name } = parsedData.data.character;
                        characterId = id;
                        positionX = position_x;
                        positionY = position_y;
                        characterName = name;
                    }
                } catch (error) {
                    console.error('解析字符串数据失败:', error);
                }
            }
            // 尝试解析data字段
            else if (data.data) {
                console.log('尝试解析data字段:', data.data);
                let parsedData = data.data;
                
                if (typeof parsedData === 'string') {
                    try {
                        parsedData = JSON.parse(parsedData);
                    } catch (error) {
                        console.error('解析data字段失败:', error);
                    }
                }
                
                if (parsedData.type === 'character.move' && parsedData.data?.character) {
                    const { id, position_x, position_y, name } = parsedData.data.character;
                    characterId = id;
                    positionX = position_x;
                    positionY = position_y;
                    characterName = name;
                } else if (parsedData.character) {
                    const { id, position_x, position_y, name } = parsedData.character;
                    characterId = id;
                    positionX = position_x;
                    positionY = position_y;
                    characterName = name;
                }
            }
            
            // 如果是当前玩家自己，忽略
            if (characterId === gameStore.character?.id) {
                console.log('忽略自己的移动事件');
                return;
            }
            
            // 如果无法解析数据，忽略
            if (!characterId || positionX === undefined || positionY === undefined) {
                console.error('无法解析角色移动数据:', data);
                return;
            }
            
            console.log(`更新玩家 ${characterId}(${characterName}) 位置到 (${positionX}, ${positionY})`);
            gameStore.updateOtherPlayerPosition(characterId, positionX, positionY, characterName);
        } catch (error) {
            console.error('处理角色移动事件出错:', error, data);
        }
    }
    
    // 处理角色进入事件
    handleCharacterEnter(data) {
        const gameStore = useGameStore.getState();
        
        if (data.character.id === gameStore.character?.id) {
            return; // 忽略自己的进入事件
        }
        
        // 检查是否是重复的进入事件
        const characterEnterTimes = gameStore.characterEnterTimes;
        const now = Date.now();
        const lastEnterTime = characterEnterTimes[data.character.id] || 0;
        
        if (now - lastEnterTime < 5000) { // 5秒内的重复事件
            return;
        }
        
        // 更新最后进入时间
        gameStore.updateCharacterEnterTime(data.character.id);
        
        // 更新其他玩家列表
        gameStore.addOtherPlayer(data.character);
    }
    
    // 处理角色离开事件
    handleCharacterLeave(data) {
        const gameStore = useGameStore.getState();
        
        if (data.character_id === gameStore.character?.id) {
            return; // 忽略自己的离开事件
        }
        
        gameStore.removeOtherPlayer(data.character_id);
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
            if (newExperience !== undefined) attributesToUpdate.experience = newExperience;
            if (newGold !== undefined) attributesToUpdate.gold = newGold;
            if (newLevel !== undefined) attributesToUpdate.level = newLevel;
            
            if (Object.keys(attributesToUpdate).length > 0) {
                gameStore.updateCharacterAttributes(attributesToUpdate);
            }
            
            // 显示击杀消息

            gameStore.addMessage(`你击杀了 ${monsterName}，获得了 ${experienceGained} 经验和 ${goldGained} 金币！`, 'success');
            
            // 如果升级了
            if (newLevel !== undefined && newLevel > gameStore.character.level) {
                gameStore.addMessage(`恭喜！你升级到了 ${newLevel} 级！`, 'success');
            }
        } else if (killerName) {
            // 如果是其他玩家击杀的
            gameStore.addMessage(`${killerName} 击杀了 ${monsterName}`, 'info');
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
        if (data.type === 'monster.respawned' && data.data) {
            const eventData = data.data;
            monsterId = eventData.monster_id;
            monsterName = eventData.monster_name;
            hp = eventData.hp;
            currentHp = eventData.current_hp;
            positionX = eventData.position_x;
            positionY = eventData.position_y;
        } 
        // 直接从data中获取数据
        else if (data.monster_id) {
            monsterId = data.monster_id;
            monsterName = data.monster_name;
            hp = data.hp;
            currentHp = data.current_hp;
            positionX = data.position_x;
            positionY = data.position_y;
        }
        // 从data.monster中获取数据
        else if (data.monster) {
            monsterId = data.monster.id || data.monster_id;
            monsterName = data.monster.name || data.monster_name;
            hp = data.monster.hp || data.hp;
            currentHp = data.monster.current_hp || data.current_hp;
            positionX = data.monster.position_x || data.position_x;
            positionY = data.monster.position_y || data.position_y;
        }
        
        if (!monsterId) {
            console.error('无法解析怪物重生数据:', data);
            return;
        }
        
        // 防抖处理：检查该怪物是否已经在短时间内重生过
        // 使用一个静态对象来存储最近处理过的怪物重生事件
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
    
    // 处理怪物点击
    async handleMonsterClick(monsterId) {
        const gameStore = useGameStore.getState();
        const monster = gameStore.monsters.find(m => m.id === monsterId);
        
        if (!monster || monster.is_dead) {
            return;
        }
        
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
            
            // 如果距离太远，先移动到怪物附近
            if (distance > 2) {
                // 计算移动目标点（怪物附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = monsterX + Math.round(Math.cos(angle));
                const targetY = monsterY + Math.round(Math.sin(angle));
                
                try {
                    // 尝试移动到目标点
                    const moveResult = await this.moveCharacter(targetX, targetY);
                    
                    // 即使移动失败，也尝试攻击
                    // 如果距离仍然太远，会在攻击API中处理
                } catch (moveError) {
                    console.error('移动到怪物附近失败:', moveError);
                    // 继续尝试攻击
                }
            }
            
            // 无论移动是否成功，都尝试攻击怪物
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
                    this.handleTeleportClick(1);
                }
                // 停止自动攻击
                this.stopAutoAttack();

                return;
            } else {
                // 继续自动攻击
                this.startAutoAttack(monsterId);
            }
        } catch (error) {
            console.error('攻击怪物失败:', error);
            gameStore.addMessage(`攻击怪物失败: ${error.message}`, 'error');
        }
    }
    
    // 处理商店点击
    async handleShopClick(shopId) {
        const gameStore = useGameStore.getState();
        
        try {
            const shop = gameStore.shops.find(s => s.id === shopId);
            if (!shop) {
                throw new Error('商店不存在');
            }
            
            // 计算角色和商店之间的距离
            const character = gameStore.character;
            const characterX = character.position_x || 0;
            const characterY = character.position_y || 0;
            const shopX = shop.x || shop.position_x || 0;
            const shopY = shop.y || shop.position_y || 0;
            
            const dx = characterX - shopX;
            const dy = characterY - shopY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果距离太远，先移动到商店附近
            if (distance > 2) {
                // 计算移动目标点（商店附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = shopX + Math.round(Math.cos(angle));
                const targetY = shopY + Math.round(Math.sin(angle));
                
                // 移动到目标点
                await this.moveCharacter(targetX, targetY);
            }
            
            // 获取商店物品
            const response = await axios.get(`/api/shop/${shopId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || '获取商店物品失败');
            }
            
            const shopItems = response.data.shop_items;
            
            // 设置商店数据到状态中，以便React组件可以使用
            gameStore.setShopModalData({
                isOpen: true,
                shop: shop,
                shopItems: shopItems
            });
            
        } catch (error) {
            console.error('打开商店失败:', error);
            gameStore.addMessage(`打开商店失败: ${error.message}`, 'error');
        }
    }
    
    // 处理NPC点击
    handleNpcClick(npcId) {
        const gameStore = useGameStore.getState();
        const npc = gameStore.npcs.find(n => n.id === npcId);
        
        if (!npc) {
            return;
        }
        
        // 显示NPC对话框
        gameStore.addMessage(`[${npc.name}] ${npc.dialogue || '你好，旅行者！'}`, 'npc');
    }
    
    // 处理传送点点击
    async handleTeleportClick(teleportId) {
        const gameStore = useGameStore.getState();
        
        try {
            const teleport = gameStore.teleportPoints.find(t => t.target_map_id === teleportId);
            if (!teleport && teleportId != 1) {
                throw new Error('传送点不存在');
            }
            
            // 计算角色和传送点之间的距离
            const character = gameStore.character;
            const characterX =  character.position_x || 0;
            const characterY = character.position_y || 0;
            const teleportX = teleport.x || teleport.position_x || 0;
            const teleportY = teleport.y || teleport.position_y || 0;
            
            const dx = characterX - teleportX;
            const dy = characterY - teleportY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果距离太远，先移动到传送点附近
            if (distance > 2) {
                // 计算移动目标点（传送点附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = teleportX + Math.round(Math.cos(angle));
                const targetY = teleportY + Math.round(Math.sin(angle));
                
                // 移动到目标点
                await this.moveCharacter(targetX, targetY);
            }
            
            // 执行传送
            gameStore.addMessage(`正在传送到 ${teleport.name}...`, 'info');
            
            const response = await axios.post('/api/map/change', {
                map_id: teleportId
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '传送失败');
            }
            
            // 离开当前地图频道
            if (window.Echo) {
                window.Echo.leave(`map.${gameStore.currentMap.id}`);
            }
            
            // 更新角色位置和地图
            gameStore.updateCharacterAttributes({
                x: response.data.new_x,
                y: response.data.new_y,
                map_id: response.data.new_map_id
            });
            gameStore.setLoading(true);
            
            // 重新加载地图数据
            const mapResponse = await axios.get(`/api/map/${teleportId}`);
            if (!mapResponse.data.success) {
                throw new Error(mapResponse.data.message || '获取地图数据失败');
            }
            
            const mapData = mapResponse.data.map;
            gameStore.setGameData(mapResponse.data);
            gameStore.setLoading(false);
            
            // 初始化新地图的WebSocket连接
            this.initWebSocketWithData(gameStore.character, mapData);
            
            gameStore.addMessage(`成功传送到 ${mapData.name}！`, 'success');
            
        } catch (error) {
            console.error('传送失败:', error);
            gameStore.addMessage(`传送失败: ${error.message}`, 'error');
            gameStore.setLoading(false);
        }
    }
    
    // 移动角色
    async moveCharacter(position_x, position_y) {
        const gameStore = useGameStore.getState();
        
        try {
            const character = gameStore.character;
            
            // 如果目标位置与当前位置相同，不执行移动
            const currentX = character.position_x || 0;
            const currentY = character.position_y || 0;
            
            if (currentX === position_x && currentY === position_y) {
                return true;
            }
            
            // 停止自动攻击
            if (gameStore.isAutoAttacking) {
                this.stopAutoAttack();
            }
            
            // 合并所有可能的障碍物
            const obstacles = [
                ...gameStore.monsters.filter(m => !m.is_dead && m.current_hp > 0),
                ...gameStore.otherPlayers,
                ...gameStore.npcs
            ];
            
            // 检查目标位置是否会发生碰撞
            const isColliding = CollisionService.isPositionColliding(
                character,
                position_x,
                position_y,
                obstacles
            );
            
            // 如果会发生碰撞，计算最近的非碰撞位置
            let finalX = position_x;
            let finalY = position_y;
            
            if (isColliding) {
                console.log('目标位置将发生碰撞，计算最近的非碰撞位置');
                
                // 计算最近的非碰撞位置
                const nearestPosition = CollisionService.findNearestNonCollidingPosition(
                    character,
                    position_x,
                    position_y,
                    obstacles
                );
                
                finalX = nearestPosition.x;
                finalY = nearestPosition.y;
                
                // 如果计算出的位置与当前位置相同，说明无法移动
                if (Math.abs(finalX - currentX) < 1 && Math.abs(finalY - currentY) < 1) {
                    // 抛出错误，以便调用者可以捕获并处理
                    throw new Error('无法移动，路径被阻挡');
                }
            }
            
            // 发送移动请求，使用调整后的位置
            const response = await axios.post('/api/character/move', { 
                position_x: finalX, 
                position_y: finalY 
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '移动失败');
            }
            
            // 更新角色位置 - 使用服务器返回的位置
            const newX = response.data.character.position_x;
            const newY = response.data.character.position_y;
            gameStore.updateCharacterPosition(newX, newY);
            
            return true;
        } catch (error) {
            throw error; // 重新抛出错误，让调用者处理
        }
    }
    
    // 使用物品
    async useItem(itemId) {
        const gameStore = useGameStore.getState();
        
        try {
            const response = await axios.post('/api/inventory/use', {
                character_item_id: itemId
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '使用物品失败');
            }
            
            // 更新角色状态
            if (response.data.character) {
                gameStore.updateCharacterAttributes(response.data.character);
            }
            
            // 更新背包
            if (response.data.inventory) {
                gameStore.setInventory(response.data.inventory);
            }
            
            gameStore.addMessage(response.data.message || '成功使用物品', 'success');
            
        } catch (error) {
            console.error('使用物品失败:', error);
            gameStore.addMessage(`使用物品失败: ${error.message}`, 'error');
        }
    }
    
    // 装备物品
    async equipItem(itemId) {
        const gameStore = useGameStore.getState();
        
        try {
            const response = await axios.post('/api/inventory/equip', {
                character_item_id: itemId
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '装备物品失败');
            }
            
            // 更新角色状态
            if (response.data.character) {
                gameStore.updateCharacterAttributes(response.data.character);
            }
            
            // 更新背包
            if (response.data.inventory) {
                gameStore.setInventory(response.data.inventory);
            }
            
            gameStore.addMessage(response.data.message || '成功装备物品', 'success');
            
        } catch (error) {
            console.error('装备物品失败:', error);
            gameStore.addMessage(error.response.data.message, 'error');
        }
    }
    
    // 卸下装备
    async unequipItem(itemId) {
        const gameStore = useGameStore.getState();
        
        try {
            const response = await axios.post('/api/inventory/unequip', {
                character_item_id: itemId
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '卸下装备失败');
            }
            
            // 更新角色状态
            if (response.data.character) {
                gameStore.updateCharacterAttributes(response.data.character);
            }
            
            // 更新背包
            if (response.data.inventory) {
                gameStore.setInventory(response.data.inventory);
            }
            
            gameStore.addMessage(response.data.message || '成功卸下装备', 'success');
            
        } catch (error) {
            console.error('卸下装备失败:', error);
            gameStore.addMessage(`卸下装备失败: ${error.message}`, 'error');
        }
    }
    
    // 丢弃物品
    async dropItem(itemId) {
        const gameStore = useGameStore.getState();
        
        try {
            // 确认丢弃
            const confirmDrop = window.confirm('确定要丢弃这个物品吗？');
            if (!confirmDrop) {
                return;
            }
            
            const response = await axios.post('/api/inventory/drop', {
                item_id: itemId
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '丢弃物品失败');
            }
            
            // 更新背包
            if (response.data.inventory) {
                gameStore.setInventory(response.data.inventory);
            }
            
            gameStore.addMessage(response.data.message || '成功丢弃物品', 'success');
            
        } catch (error) {
            console.error('丢弃物品失败:', error);
            gameStore.addMessage(`丢弃物品失败: ${error.message}`, 'error');
        }
    }
    
    // 购买物品
    async buyItem(shopItemId, quantity = 1) {
        const gameStore = useGameStore.getState();
        
        try {
            const response = await axios.post('/api/shop/buy', {
                shop_item_id: shopItemId,
                quantity
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '购买物品失败');
            }
            
            // 更新角色金币
            gameStore.updateCharacterAttributes({
                gold: response.data.new_gold || response.data.current_gold
            });
            
            // 更新背包
            if (response.data.inventory) {
                gameStore.setInventory(response.data.inventory);
            }
            
            gameStore.addMessage(response.data.message || `成功购买物品 x${quantity}`, 'success');
            
        } catch (error) {
            console.error('购买物品失败:', error);
            gameStore.addMessage(`购买物品失败: ${error.message}`, 'error');
            throw error; // 重新抛出错误，让调用者处理
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
            
            // 显示受伤消息
            const attackerName = data.attacker_name || '怪物';
            if (data.is_critical) {
                gameStore.addMessage(`暴击！${attackerName} 对你造成了 ${data.damage} 点伤害！`, 'error');
            } else {
                gameStore.addMessage(`${attackerName}-${data.character_damage}, 你-${data.monster_damage}`, 'warning');
            }
            
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
    
    // 初始化WebSocket
    initWebSocket() {
        const gameStore = useGameStore.getState();
        
        if (!window.Echo) {
            console.error('Echo未初始化');
            return false;
        }
        
        // 如果已经有角色和地图数据，直接初始化WebSocket
        const { character, currentMap } = gameStore;
        if (character && currentMap) {
            return this.initWebSocketWithData(character, currentMap);
        }
        
        return false;
    }
}

// 创建单例实例
const gameService = new GameService();

export default gameService; 