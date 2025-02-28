import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 创建游戏上下文
export const GameContext = createContext(null);

// 游戏上下文提供者组件
export function GameProvider({ children }) {
    const [character, setCharacter] = useState(null);
    const [currentMap, setCurrentMap] = useState(null);
    const [monsters, setMonsters] = useState([]);
    const [shops, setShops] = useState([]);
    const [otherPlayers, setOtherPlayers] = useState([]);
    const [npcs, setNpcs] = useState([]);
    const [teleportPoints, setTeleportPoints] = useState([]);
    const [mapMarkers, setMapMarkers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isAutoAttacking, setIsAutoAttacking] = useState(false);
    const [currentAttackingMonsterId, setCurrentAttackingMonsterId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // 加载游戏数据
    const loadGameData = async () => {
        try {
            setIsLoading(true);
            addMessage('正在加载角色数据...', 'info');
            
            // 获取角色信息
            const characterResponse = await axios.get('/api/character');
            if (!characterResponse.data.success) {
                throw new Error(characterResponse.data.message || '获取角色数据失败');
            }
            
            const characterData = characterResponse.data.character;
            setCharacter(characterData);
            addMessage(`欢迎回来，${characterData.name}！`, 'success');
            
            // 获取当前地图信息
            addMessage('正在加载地图数据...', 'info');
            const mapResponse = await axios.get(`/api/map/${characterData.current_map_id}`);
            if (!mapResponse.data.success) {
                throw new Error(mapResponse.data.message || '获取地图数据失败');
            }
            
            const { map, monsters, shops, other_players, npcs, teleport_points, map_markers } = mapResponse.data;
            setCurrentMap(map);
            setMonsters(monsters || []);
            setShops(shops || []);
            setOtherPlayers(other_players || []);
            setNpcs(npcs || []);
            
            // 处理传送点数据
            console.log('传送点数据:', teleport_points);
            if (teleport_points && Array.isArray(teleport_points)) {
                // 为每个传送点添加id和target_map_name属性
                const processedTeleportPoints = teleport_points.map((point, index) => {
                    // 如果没有id，使用索引作为id
                    if (!point.id) {
                        point.id = index + 1;
                    }
                    
                    // 如果没有target_map_name，使用name属性
                    if (!point.target_map_name && point.name) {
                        point.target_map_name = point.name;
                    }
                    
                    return point;
                });
                
                setTeleportPoints(processedTeleportPoints);
            } else {
                setTeleportPoints([]);
            }
            
            setMapMarkers(map_markers || []);
            
            // 获取背包数据
            addMessage('正在加载背包数据...', 'info');
            const inventoryResponse = await axios.get('/api/inventory');
            if (inventoryResponse.data.success) {
                setInventory(inventoryResponse.data.inventory || []);
            } else {
                addMessage('背包数据加载失败', 'warning');
            }
            
            // 确保角色和地图数据都已加载完成后再初始化WebSocket
            // 使用局部变量而不是React状态
            if (characterData && characterData.id && map) {
                // 直接初始化WebSocket，不依赖React状态
                initWebSocketWithData(characterData, map);
            } else {
                console.error('无法初始化WebSocket：角色或地图数据加载失败');
                console.log('角色数据:', characterData);
                console.log('地图数据:', map);
                addMessage('实时连接初始化失败，部分功能可能不可用', 'error');
            }
            
            addMessage('游戏数据加载成功', 'success');
        } catch (error) {
            console.error('加载游戏数据出错:', error);
            addMessage(`加载游戏数据时发生错误: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    // 使用useEffect在组件挂载时加载游戏数据
    useEffect(() => {
        loadGameData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // 使用原始数据初始化WebSocket，不依赖React状态
    const initWebSocketWithData = (characterData, mapData) => {
        if (!characterData || !characterData.id) {
            console.warn('WebSocket初始化失败：角色数据无效');
            return;
        }
        
        if (!mapData) {
            console.warn('WebSocket初始化失败：地图数据无效');
            return;
        }
        
        const mapId = characterData.current_map_id;
        if (!mapId) {
            console.warn('WebSocket初始化失败：地图ID不存在');
            return;
        }
        
        console.log('初始化WebSocket连接，角色ID:', characterData.id, '地图ID:', mapId);
        
        try {
            // 确保Echo对象存在
            if (!window.Echo) {
                console.error('Echo对象不存在，无法初始化WebSocket');
                addMessage('实时连接初始化失败，部分功能可能不可用', 'error');
                return;
            }
            
            // 先离开之前的频道（如果有）
            Object.keys(window.Echo.connector.channels).forEach(channel => {
                if (channel.startsWith('presence-map.')) {
                    const channelName = channel.replace('presence-', '');
                    console.log('离开之前的地图频道:', channelName);
                    window.Echo.leave(channelName);
                }
            });
            
            // 订阅到地图频道接收实时事件
            const mapChannel = window.Echo.join(`map.${mapId}`);
            
            // 监听广播的游戏事件
            mapChannel.listen('.game.event', (eventData) => {
                console.log('收到游戏事件:', eventData);
                
                if (!eventData || !eventData.type) {
                    console.warn('收到无效的游戏事件数据');
                    return;
                }
                
                // 处理不同类型的事件
                switch (eventData.type) {
                    case 'character.move':
                        handleCharacterMove(eventData.data);
                        break;
                    case 'character.enter':
                        handleCharacterEnter(eventData.data);
                        break;
                    case 'character.leave':
                        handleCharacterLeave(eventData.data);
                        break;
                    case 'monster.killed':
                        handleMonsterKilled(eventData.data);
                        break;
                    case 'monster.respawning':
                        handleMonsterRespawning(eventData.data);
                        break;
                    case 'monster.respawned':
                        handleMonsterRespawned(eventData.data);
                        break;
                    default:
                        console.log(`未处理的事件类型: ${eventData.type}`, eventData.data);
                }
            });
            
            // 处理玩家加入事件
            mapChannel.here((users) => {
                console.log('当前在线玩家:', users);
                // 更新其他玩家列表
                const filteredPlayers = users.filter(user => user.id !== characterData.id);
                setOtherPlayers(filteredPlayers);
            });
            
            mapChannel.joining((user) => {
                console.log('玩家加入地图:', user);
                if (user.id !== characterData.id) {
                    addMessage(`${user.name || '玩家'} 进入了地图`, 'info');
                    setOtherPlayers(prev => {
                        // 检查玩家是否已经在列表中
                        if (!prev.find(p => p.id === user.id)) {
                            return [...prev, user];
                        }
                        return prev;
                    });
                }
            });
            
            mapChannel.leaving((user) => {
                console.log('玩家离开地图:', user);
                if (user && user.id && user.id !== characterData.id) {
                    addMessage(`${user.name || '玩家'} 离开了地图`, 'info');
                    setOtherPlayers(prev => prev.filter(p => p.id !== user.id));
                }
            });
            
            // 发送当前玩家加入地图的事件
            axios.post('/api/map/enter', { map_id: mapId })
                .then(response => {
                    console.log('发送地图进入通知成功:', response.data);
                })
                .catch(error => {
                    console.error('发送地图进入通知失败:', error);
                });
                
            console.log('WebSocket初始化完成');
        } catch (error) {
            console.error('WebSocket初始化失败:', error);
            addMessage('实时连接失败，部分功能可能不可用', 'error');
        }
    };
    
    // 处理其他玩家移动事件
    const handleCharacterMove = (data) => {
        // 确保数据完整且不是当前玩家自己
        if (!data || !data.character || !data.character.id || data.character.id === character?.id) {
            console.log('忽略移动事件:', data);
            return;
        }
        
        console.log('收到角色移动事件:', data);
        
        // 更新其他玩家列表中的位置
        setOtherPlayers(prev => {
            return prev.map(player => {
                if (player.id === data.character.id) {
                    return {
                        ...player,
                        position_x: data.character.position_x,
                        position_y: data.character.position_y
                    };
                }
                return player;
            });
        });
    };
    
    // 处理其他玩家进入事件
    const handleCharacterEnter = (data) => {
        if (!data || !data.character || !data.character.id || data.character.id === character?.id) {
            return;
        }
        
        console.log('玩家进入:', data.character);
        addMessage(`${data.character.name || '玩家'} 进入了地图`, 'info');
        
        setOtherPlayers(prev => {
            // 检查玩家是否已经在列表中
            if (!prev.find(p => p.id === data.character.id)) {
                return [...prev, data.character];
            }
            return prev;
        });
    };
    
    // 处理其他玩家离开事件
    const handleCharacterLeave = (data) => {
        if (!data || !data.character_id || data.character_id === character?.id) {
            return;
        }
        
        const leavingPlayer = otherPlayers.find(p => p.id === data.character_id);
        if (leavingPlayer) {
            console.log('玩家离开:', leavingPlayer.name);
            addMessage(`${leavingPlayer.name || '玩家'} 离开了地图`, 'info');
        }
        
        setOtherPlayers(prev => prev.filter(p => p.id !== data.character_id));
    };
    
    // 处理怪物被击杀事件
    const handleMonsterKilled = (data) => {
        console.log('处理怪物死亡事件:', data);
        
        // 更新怪物列表，将怪物标记为死亡
        setMonsters(prev => prev.map(monster => {
            if (monster.id === data.monster_id) {
                return {
                    ...monster,
                    current_hp: 0,
                    hp_percentage: 0,
                    is_dead: true
                };
            }
            return monster;
        }));
        
        // 如果不是当前玩家击杀的，显示消息
        if (data.killer_id !== character.id) {
            addMessage(`${data.killer_name} 击败了 ${data.monster_name}！`, 'info');
        }
    };
    
    // 处理怪物即将重生事件
    const handleMonsterRespawning = (data) => {
        console.log('怪物即将重生:', data);
        addMessage(`${data.monster_name} 将在 ${data.respawn_time} 秒后重生`, 'info');
    };
    
    // 处理怪物重生事件
    const handleMonsterRespawned = (data) => {
        console.log('怪物重生:', data);
        
        // 更新怪物列表
        setMonsters(prev => {
            // 查找怪物是否已存在
            const monsterIndex = prev.findIndex(m => m.id === data.monster_id);
            
            if (monsterIndex !== -1) {
                // 更新现有怪物
                const updatedMonsters = [...prev];
                updatedMonsters[monsterIndex] = {
                    ...updatedMonsters[monsterIndex],
                    current_hp: data.current_hp,
                    hp: data.hp,
                    hp_percentage: data.hp_percentage,
                    is_dead: false,
                    x: data.position_x,
                    y: data.position_y
                };
                return updatedMonsters;
            } else {
                // 添加新怪物
                return [...prev, {
                    id: data.monster_id,
                    name: data.monster_name,
                    current_hp: data.current_hp,
                    hp: data.hp,
                    hp_percentage: data.hp_percentage,
                    is_dead: false,
                    x: data.position_x,
                    y: data.position_y
                }];
            }
        });
        
        addMessage(`${data.monster_name} 已重生`, 'info');
    };
    
    // 添加消息
    const addMessage = (message, type = 'info') => {
        setMessages(prev => [...prev, { text: message, type, timestamp: new Date() }]);
    };
    
    // 处理怪物点击
    const handleMonsterClick = async (monsterId) => {
        console.log('点击怪物:', monsterId);
        
        // 查找怪物信息
        const monster = monsters.find(m => m.id === monsterId);
        if (monster) {
            // 检查怪物是否已经死亡
            if (monster.is_dead || monster.current_hp <= 0) {
                addMessage(`${monster.name} 已经死亡，无法攻击`, 'warning');
                return;
            }
            
            addMessage(`你攻击了怪物: ${monster.name}`, 'combat');
            
            try {
                // 发送攻击请求
                const response = await axios.post('/api/monster/attack', { monster_id: monsterId });
                
                if (response.data.success) {
                    // 更新怪物信息
                    const updatedMonster = response.data.monster;
                    
                    // 更新怪物列表
                    setMonsters(prev => prev.map(m => {
                        if (m.id === monsterId) {
                            return {
                                ...m,
                                current_hp: updatedMonster.current_hp,
                                hp_percentage: (updatedMonster.current_hp / updatedMonster.hp) * 100,
                                is_dead: updatedMonster.is_dead || updatedMonster.current_hp <= 0
                            };
                        }
                        return m;
                    }));
                    
                    // 显示伤害信息
                    if (response.data.damage) {
                        addMessage(`你对 ${monster.name} 造成了 ${response.data.damage} 点伤害`, 'combat');
                    }
                    
                    // 检查怪物是否死亡
                    if (response.data.monster_killed) {
                        addMessage(`你击败了 ${monster.name}！`, 'success');
                        
                        // 显示获得的经验和金币
                        if (response.data.exp_gained) {
                            addMessage(`获得了 ${response.data.exp_gained} 点经验`, 'success');
                        }
                        
                        if (response.data.gold_gained) {
                            addMessage(`获得了 ${response.data.gold_gained} 金币`, 'success');
                        }
                        
                        // 更新角色信息
                        if (response.data.character) {
                            setCharacter(response.data.character);
                        }
                    }
                } else {
                    addMessage(response.data.message || '攻击失败', 'error');
                }
            } catch (error) {
                console.error('攻击怪物出错:', error);
                addMessage('攻击怪物出错，请稍后再试', 'error');
            }
        }
    };
    
    // 处理商店点击
    const handleShopClick = async (shopId) => {
        console.log('点击商店:', shopId);
        
        // 查找商店信息
        const shop = shops.find(s => s.id === shopId);
        if (shop) {
            addMessage(`你访问了商店: ${shop.name}`, 'info');
            
            try {
                // 获取商店物品
                const response = await axios.get(`/api/shop/${shopId}`);
                
                if (response.data.success) {
                    // 显示商店物品
                    const shopItems = response.data.shop_items;
                    
                    // 创建商店模态框
                    const shopModal = document.createElement('div');
                    shopModal.className = 'shop-modal';
                    shopModal.innerHTML = `
                        <div class="shop-modal-content">
                            <div class="shop-modal-header">
                                <h3>${shop.name}</h3>
                                <span class="close-btn">&times;</span>
                            </div>
                            <div class="shop-modal-body">
                                <div class="shop-items">
                                    ${shopItems.length > 0 ? 
                                        shopItems.map(item => `
                                            <div class="shop-item" data-item-id="${item.item_id}">
                                                <div class="item-name">${item.item_name}</div>
                                                <div class="item-price">${item.price} 金币</div>
                                                <button class="buy-btn" data-shop-item-id="${item.id}">购买</button>
                                            </div>
                                        `).join('') : 
                                        '<div class="no-items">该商店暂无商品</div>'
                                    }
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // 添加到页面
                    document.body.appendChild(shopModal);
                    
                    // 添加关闭按钮事件
                    const closeBtn = shopModal.querySelector('.close-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            shopModal.remove();
                        });
                    }
                    
                    // 添加购买按钮事件
                    const buyBtns = shopModal.querySelectorAll('.buy-btn');
                    buyBtns.forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const shopItemId = btn.dataset.shopItemId;
                            try {
                                const buyResponse = await axios.post('/api/shop/buy', { shop_item_id: shopItemId });
                                
                                if (buyResponse.data.success) {
                                    addMessage(buyResponse.data.message || '购买成功', 'success');
                                    
                                    // 更新角色信息
                                    if (buyResponse.data.character) {
                                        setCharacter(buyResponse.data.character);
                                    }
                                    
                                    // 更新背包
                                    if (buyResponse.data.inventory) {
                                        setInventory(buyResponse.data.inventory);
                                    }
                                } else {
                                    addMessage(buyResponse.data.message || '购买失败', 'error');
                                }
                            } catch (error) {
                                console.error('购买物品出错:', error);
                                addMessage('购买物品出错，请稍后再试', 'error');
                            }
                        });
                    });
                } else {
                    addMessage(response.data.message || '获取商店信息失败', 'error');
                }
            } catch (error) {
                console.error('获取商店信息出错:', error);
                addMessage('获取商店信息出错，请稍后再试', 'error');
            }
        }
    };
    
    // 处理NPC点击
    const handleNpcClick = (npcId) => {
        console.log('点击NPC:', npcId);
        
        // 查找NPC信息
        const npc = npcs.find(n => n.id === npcId);
        if (npc) {
            addMessage(`你点击了NPC: ${npc.name}`, 'info');
            // 这里可以添加对话或任务逻辑
            if (npc.has_quest) {
                addMessage(`${npc.name}有任务给你！`, 'quest');
            }
        }
    };
    
    // 处理传送点点击
    const handleTeleportClick = async (teleportId) => {
        console.log('点击传送点:', teleportId);
        
        // 查找传送点信息
        const teleport = teleportPoints.find(t => t.id === teleportId);
        if (teleport) {
            addMessage(`你点击了传送点，目标地图: ${teleport.target_map_name}`, 'info');
            
            // 检查等级要求
            if (teleport.level_required && character.level < teleport.level_required) {
                addMessage(`你的等级不足，需要达到 ${teleport.level_required} 级才能传送到 ${teleport.target_map_name}`, 'error');
                return;
            }
            
            try {
                // 添加传送动画效果
                addMessage(`正在传送到 ${teleport.target_map_name}...`, 'info');
                
                // 调用传送API
                const response = await axios.post('/api/character/teleport', {
                    map_id: teleport.target_map_id,
                    position_x: teleport.target_x || teleport.target_position_x || 0,
                    position_y: teleport.target_y || teleport.target_position_y || 0
                });
                
                if (response.data.success) {
                    // 更新角色位置和地图
                    setCharacter(prev => ({
                        ...prev,
                        current_map_id: teleport.target_map_id,
                        position_x: teleport.target_x || teleport.target_position_x || 0,
                        position_y: teleport.target_y || teleport.target_position_y || 0
                    }));
                    
                    // 加载新地图数据
                    setTimeout(async () => {
                        // 获取新地图信息
                        const mapResponse = await axios.get(`/api/map/${teleport.target_map_id}`);
                        if (mapResponse.data.success) {
                            const { map, monsters, shops, other_players, npcs, teleport_points, map_markers } = mapResponse.data;
                            setCurrentMap(map);
                            setMonsters(monsters || []);
                            setShops(shops || []);
                            setOtherPlayers(other_players || []);
                            setNpcs(npcs || []);
                            
                            // 处理传送点数据
                            console.log('传送点数据:', teleport_points);
                            if (teleport_points && Array.isArray(teleport_points)) {
                                // 为每个传送点添加id和target_map_name属性
                                const processedTeleportPoints = teleport_points.map((point, index) => {
                                    // 如果没有id，使用索引作为id
                                    if (!point.id) {
                                        point.id = index + 1;
                                    }
                                    
                                    // 如果没有target_map_name，使用name属性
                                    if (!point.target_map_name && point.name) {
                                        point.target_map_name = point.name;
                                    }
                                    
                                    return point;
                                });
                                
                                setTeleportPoints(processedTeleportPoints);
                            } else {
                                setTeleportPoints([]);
                            }
                            
                            setMapMarkers(map_markers || []);
                            
                            // 重新初始化WebSocket连接
                            // 添加延迟确保状态已更新
                            setTimeout(() => {
                                // 使用最新的地图数据和角色数据
                                const updatedCharacter = {
                                    ...character,
                                    current_map_id: teleport.target_map_id
                                };
                                
                                // 使用新的函数初始化WebSocket
                                initWebSocketWithData(updatedCharacter, map);
                            }, 300);
                            
                            addMessage(`传送成功！欢迎来到 ${teleport.target_map_name}`, 'success');
                        } else {
                            addMessage(`加载新地图数据失败: ${mapResponse.data.message}`, 'error');
                        }
                    }, 1000); // 延迟1秒加载新地图，模拟传送过程
                } else {
                    addMessage(`传送失败: ${response.data.message}`, 'error');
                }
            } catch (error) {
                console.error('传送请求出错:', error);
                addMessage(`传送请求出错: ${error.message}`, 'error');
            }
        }
    };
    
    // 移动角色
    const moveCharacter = async (x, y) => {
        try {
            // 更新本地角色位置（立即反馈）
            if (character) {
                setCharacter(prev => ({
                    ...prev,
                    position_x: x,
                    position_y: y
                }));
            }
            
            // 调用API
            const response = await axios.post('/api/character/move', {
                position_x: x,
                position_y: y
            });
            
            if (response.data.success) {
                console.log('移动成功:', response.data);
            } else {
                console.error('移动失败:', response.data.message);
                addMessage(`移动失败: ${response.data.message}`, 'error');
                
                // 如果服务器拒绝移动，恢复原始位置
                if (response.data.character) {
                    setCharacter(response.data.character);
                }
            }
        } catch (error) {
            console.error('移动请求出错:', error);
            addMessage('移动请求出错，请稍后再试', 'error');
        }
    };
    
    // 使用物品
    const useItem = async (itemId) => {
        try {
            console.log('使用物品:', itemId);
            addMessage('正在使用物品...', 'info');
            
            const response = await axios.post('/api/inventory/use', { inventory_id: itemId });
            
            if (response.data.success) {
                addMessage(response.data.message || '成功使用物品', 'success');
                
                // 更新角色信息和背包
                if (response.data.character) {
                    setCharacter(response.data.character);
                }
                
                if (response.data.inventory) {
                    setInventory(response.data.inventory);
                }
            } else {
                addMessage(response.data.message || '使用物品失败', 'error');
            }
        } catch (error) {
            console.error('使用物品出错:', error);
            addMessage('使用物品出错，请稍后再试', 'error');
        }
    };
    
    // 装备物品
    const equipItem = async (itemId) => {
        try {
            console.log('装备物品:', itemId);
            addMessage('正在装备物品...', 'info');
            
            const response = await axios.post('/api/inventory/equip', { inventory_id: itemId });
            
            if (response.data.success) {
                addMessage(response.data.message || '成功装备物品', 'success');
                
                // 更新角色信息和背包
                if (response.data.character) {
                    setCharacter(response.data.character);
                }
                
                if (response.data.inventory) {
                    setInventory(response.data.inventory);
                }
            } else {
                addMessage(response.data.message || '装备物品失败', 'error');
            }
        } catch (error) {
            console.error('装备物品出错:', error);
            addMessage('装备物品出错，请稍后再试', 'error');
        }
    };
    
    // 卸下物品
    const unequipItem = async (itemId) => {
        try {
            console.log('卸下物品:', itemId);
            addMessage('正在卸下物品...', 'info');
            
            const response = await axios.post('/api/inventory/unequip', { inventory_id: itemId });
            
            if (response.data.success) {
                addMessage(response.data.message || '成功卸下物品', 'success');
                
                // 更新角色信息和背包
                if (response.data.character) {
                    setCharacter(response.data.character);
                }
                
                if (response.data.inventory) {
                    setInventory(response.data.inventory);
                }
            } else {
                addMessage(response.data.message || '卸下物品失败', 'error');
            }
        } catch (error) {
            console.error('卸下物品出错:', error);
            addMessage('卸下物品出错，请稍后再试', 'error');
        }
    };
    
    // 丢弃物品
    const dropItem = async (itemId) => {
        try {
            console.log('丢弃物品:', itemId);
            
            // 确认丢弃
            if (!window.confirm('确定要丢弃这个物品吗？')) {
                return;
            }
            
            addMessage('正在丢弃物品...', 'info');
            
            const response = await axios.post('/api/inventory/drop', { inventory_id: itemId });
            
            if (response.data.success) {
                addMessage(response.data.message || '成功丢弃物品', 'success');
                
                // 更新背包
                if (response.data.inventory) {
                    setInventory(response.data.inventory);
                }
            } else {
                addMessage(response.data.message || '丢弃物品失败', 'error');
            }
        } catch (error) {
            console.error('丢弃物品出错:', error);
            addMessage('丢弃物品出错，请稍后再试', 'error');
        }
    };
    
    // 使用技能
    const useSkill = async (skillId, targetId) => {
        // 这里将实现使用技能逻辑
        console.log('使用技能:', skillId, '目标:', targetId);
    };
    
    // 购买物品
    const buyItem = async (shopItemId, quantity = 1) => {
        // 这里将实现购买物品逻辑
        console.log('购买物品:', shopItemId, '数量:', quantity);
    };
    
    // 开始自动攻击
    const startAutoAttack = (monsterId) => {
        setIsAutoAttacking(true);
        setCurrentAttackingMonsterId(monsterId);
        // 这里将实现自动攻击逻辑
        console.log('开始自动攻击怪物:', monsterId);
    };
    
    // 停止自动攻击
    const stopAutoAttack = () => {
        setIsAutoAttacking(false);
        setCurrentAttackingMonsterId(null);
        console.log('停止自动攻击');
    };
    
    // 初始化WebSocket连接
    const initWebSocket = () => {
        // 再次检查角色和地图数据是否已加载
        if (!character || !character.id) {
            console.warn('WebSocket初始化失败：角色数据尚未加载');
            return;
        }
        
        if (!currentMap) {
            console.warn('WebSocket初始化失败：地图数据尚未加载');
            return;
        }
        
        // 使用新的函数初始化WebSocket
        initWebSocketWithData(character, currentMap);
    };
    
    // 提供上下文值
    const contextValue = {
        character,
        currentMap,
        monsters,
        shops,
        otherPlayers,
        npcs,
        teleportPoints,
        mapMarkers,
        inventory,
        messages,
        isAutoAttacking,
        currentAttackingMonsterId,
        isLoading,
        loadGameData,
        addMessage,
        handleMonsterClick,
        handleShopClick,
        handleNpcClick,
        handleTeleportClick,
        moveCharacter,
        useSkill,
        useItem,
        equipItem,
        unequipItem,
        dropItem,
        buyItem,
        startAutoAttack,
        stopAutoAttack
    };
    
    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
}

// 自定义钩子，用于访问游戏上下文
export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
} 