import axios from 'axios';
import useGameStore from '../store/gameStore';
import CollisionService from './collisionService';
import websocketService from './websocketService';

// 角色服务 - 处理角色相关的API调用和业务逻辑
class CharacterService {
    // 加载角色数据
    async loadCharacterData() {
        const gameStore = useGameStore.getState();
        
        try {
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
            
            return characterData;
        } catch (error) {
            console.error('加载角色数据失败:', error);
            gameStore.addMessage(`加载角色数据失败: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 移动角色
    async moveCharacter(position_x, position_y, options = {}) {
        const gameStore = useGameStore.getState();
        
        try {
            const character = gameStore.character;
            
            // 如果目标位置与当前位置相同，不执行移动
            const currentX = character.position_x || 0;
            const currentY = character.position_y || 0;
            
            if (currentX === position_x && currentY === position_y) {
                return true;
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
            }

            // 立即发送最终位置到服务器
            try {
                const response = await axios.post('/api/character/move', { 
                    position_x: finalX, 
                    position_y: finalY 
                });
                
                if (!response.data.success) {
                    throw new Error(response.data.message || '移动失败');
                }
            } catch (error) {
                console.error('发送位置失败:', error);
                throw error;
            }

            // 使用gameStore的动画逻辑更新位置
            gameStore.updateCharacterPosition(finalX, finalY);

            // 计算从当前位置到目标位置的距离
            const startX = character.position_x || 0;
            const startY = character.position_y || 0;
            const dx = finalX - startX;
            const dy = finalY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 根据距离和速度计算移动所需时间（毫秒）
            // 游戏中的移动速度是每帧5个单位，假设每秒60帧
            const speed = 5 * 60; // 每秒的移动速度
            const moveTime = (distance / speed) * 1000; // 移动所需的毫秒数

            // 移动完成后自动定位到玩家位置
            setTimeout(() => {
               const locatePlayerEvent = new CustomEvent('locatePlayer');
               document.dispatchEvent(locatePlayerEvent);
           }, moveTime); // 短暂延迟确保位置更新完成
            
            // 如果不是由传送点触发的移动，检查是否有传送点在附近
            if (!options.isFromTeleport && !options.skipTeleportCheck) {
                // 检查是否有传送点在附近
                const nearbyTeleport = gameStore.teleportPoints.find(teleport => {
                    const teleportX = teleport.x || teleport.position_x || 0;
                    const teleportY = teleport.y || teleport.position_y || 0;
                    
                    const dx = finalX - teleportX;
                    const dy = finalY - teleportY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    return distance <= 2; // 如果距离小于等于2格，认为在传送点附近
                });
                
                // 如果有传送点在附近，并且设置了自动传送，则触发传送
                if (nearbyTeleport && options.autoTeleport) {
                    // 计算从当前位置到目标位置的距离
                    const startX = character.position_x || 0;
                    const startY = character.position_y || 0;
                    const dx = finalX - startX;
                    const dy = finalY - startY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 根据距离和速度计算移动所需时间（毫秒）
                    // 游戏中的移动速度是每帧5个单位，假设每秒60帧
                    const speed = 5 * 60; // 每秒的移动速度
                    const moveTime = (distance / speed) * 1000; // 移动所需的毫秒数
                    
                    // 确保等待时间至少为100毫秒，最多为2000毫秒
                    const waitTime = Math.max(100, Math.min(moveTime, 2000));
                    
                    console.log(`移动到传送点距离: ${distance.toFixed(2)}, 等待时间: ${waitTime.toFixed(0)}ms`);
                    
                    // 等待计算出的时间，确保移动动画完成
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    
                    // 导入并调用mapService的handleTeleportClick方法
                    const mapService = await import('./mapService');
                    await mapService.default.handleTeleportClick(nearbyTeleport.target_map_id, {
                        x: nearbyTeleport.x || nearbyTeleport.position_x,
                        y: nearbyTeleport.y || nearbyTeleport.position_y
                    }, { isAutoTeleport: true });
                }
            } else if (options.isFromTeleport && options.autoTeleport) {
                // 如果是由传送点触发的移动，并且设置了自动传送
                // 计算从当前位置到目标位置的距离
                const startX = character.position_x || 0;
                const startY = character.position_y || 0;
                const dx = finalX - startX;
                const dy = finalY - startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                console.log('传送点移动距离:', distance);
                
                // 根据距离和速度计算移动所需时间（毫秒）
                // 游戏中的移动速度是每帧5个单位，假设每秒60帧
                const speed = 5 * 60; // 每秒的移动速度
                const moveTime = (distance / speed) * 1000; // 移动所需的毫秒数
                
                // 确保等待时间至少为100毫秒，最多为2000毫秒
                const waitTime = Math.max(100, Math.min(moveTime, 2000));
                
                console.log(`传送点移动距离: ${distance.toFixed(2)}, 等待时间: ${waitTime.toFixed(0)}ms`);
                
                // 等待计算出的时间，确保移动动画完成
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                // 查找最近的传送点
                const nearbyTeleport = gameStore.teleportPoints.reduce((closest, teleport) => {
                    const teleportX = teleport.x || teleport.position_x || 0;
                    const teleportY = teleport.y || teleport.position_y || 0;
                    
                    const dx = finalX - teleportX;
                    const dy = finalY - teleportY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 如果距离小于等于120，并且比当前最近点更近
                    if (distance <= 120 && (!closest || distance < closest.distance)) {
                        return { ...teleport, distance };
                    }
                    return closest;
                }, null);

                console.log('查找最近的传送点:', nearbyTeleport);
                
                if (nearbyTeleport) {
                    console.log('找到最近的传送点，开始传送');
                    // 导入并调用mapService的handleTeleportClick方法
                    const mapService = await import('./mapService');
                    await mapService.default.handleTeleportClick(nearbyTeleport.target_map_id, {
                        x: nearbyTeleport.x || nearbyTeleport.position_x,
                        y: nearbyTeleport.y || nearbyTeleport.position_y
                    }, { isAutoTeleport: true });
                }
            }
            
            // 处理商店自动打开逻辑
            if (options.isFromShop && options.autoOpenShop && options.shopId) {
                try {
                    // 计算从当前位置到目标位置的距离
                    const startX = character.position_x || 0;
                    const startY = character.position_y || 0;
                    const dx = finalX - startX;
                    const dy = finalY - startY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 根据距离和速度计算移动所需时间（毫秒）
                    // 游戏中的移动速度是每帧5个单位，假设每秒60帧
                    const speed = 5 * 60; // 每秒的移动速度
                    const moveTime = (distance / speed) * 1000; // 移动所需的毫秒数
                    
                    // 确保等待时间至少为100毫秒，最多为2000毫秒
                    const waitTime = Math.max(100, Math.min(moveTime, 2000));
                    
                    console.log(`移动距离: ${distance.toFixed(2)}, 等待时间: ${waitTime.toFixed(0)}ms`);
                    
                    // 等待计算出的时间，确保移动动画完成
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    
                    // 导入并调用npcService的handleShopClick方法
                    const { default: npcService } = await import('./npcService');
                    await npcService.handleShopClick(options.shopId, { isAutoOpen: true });
                } catch (error) {
                    console.error('自动打开商店失败:', error);
                    gameStore.addMessage('自动打开商店失败', 'error');
                }
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    }
    
    // 处理角色移动事件
    handleCharacterMove(data) {
        const gameStore = useGameStore.getState();
        console.log('characterService处理角色移动事件，原始数据:', data);
        
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
            
            // 获取其他玩家当前位置
            const otherPlayer = gameStore.otherPlayers.find(p => p.id === characterId);
            if (!otherPlayer) {
                // 如果玩家不存在，直接添加到新位置
                gameStore.updateOtherPlayerPosition(characterId, positionX, positionY, characterName);
                return;
            }

            // 计算移动距离和方向
            const currentX = otherPlayer.position_x || 0;
            const currentY = otherPlayer.position_y || 0;
            const dx = positionX - currentX;
            const dy = positionY - currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 设置移动速度（与玩家角色相同）
            const speed = 200;
            const duration = (distance / speed) * 1000;
            
            // 开始移动动画
            const startTime = Date.now();
            const animate = () => {
                const currentTime = Date.now();
                const progress = Math.min((currentTime - startTime) / duration, 1);
                
                // 使用线性插值计算当前位置
                const currentPosX = currentX + dx * progress;
                const currentPosY = currentY + dy * progress;
                
                // 更新其他玩家位置
                gameStore.updateOtherPlayerPosition(
                    characterId,
                    Math.round(currentPosX),
                    Math.round(currentPosY),
                    characterName
                );
                
                // 如果动画未完成，继续下一帧
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // 动画完成后，更新最终位置
                    gameStore.updateOtherPlayerFinalPosition(characterId, positionX, positionY);
                }
            };
            
            // 启动动画
            animate();
            
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
            const characterData = await this.loadCharacterData();
            
            // 检查角色的地图ID是否存在
            if (!characterData.current_map_id) {
                console.error('角色没有地图ID，使用默认地图ID 1');
                characterData.current_map_id = 1; // 设置默认地图ID
                gameStore.addMessage('无法获取角色当前地图，使用默认地图', 'warning');
            }
            
            // 获取地图信息
            const mapService = await import('./mapService');
            const mapData = await mapService.default.loadMapData(characterData.current_map_id);
            
            // 获取背包信息
            const inventoryService = await import('./inventoryService');
            await inventoryService.default.loadInventory();
            
            // 初始化WebSocket连接
            console.log('准备初始化WebSocket连接...');
            
            if (!window.Echo) {
                console.error('Echo未初始化，无法建立WebSocket连接');
            } else {
                console.log('Echo已初始化，准备连接到地图频道');
                websocketService.initWebSocketWithData(characterData, mapData);
            }
            
            gameStore.addMessage('游戏数据加载完成！', 'success');
        } catch (error) {
            console.error('加载游戏数据失败:', error);
            gameStore.addMessage(`加载游戏数据失败: ${error.message}`, 'error');
        } finally {
            gameStore.setLoading(false);
        }
    }
}

// 创建单例实例
const characterService = new CharacterService();

export default characterService; 