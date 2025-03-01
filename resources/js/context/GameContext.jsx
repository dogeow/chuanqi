import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gameService from '../services/gameService';

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
    // 添加一个ref来跟踪是否已经开始加载
    const isLoadingStartedRef = useRef(false);
    // 添加一个ref来存储最近的消息，用于防止重复
    const recentMessagesRef = useRef({});
    // 创建一个ref来存储角色进入事件的时间戳
    const characterEnterTimes = useRef({});
    
    // 加载游戏数据
    const loadGameData = async () => {
        // 如果已经开始加载，则不再重复加载
        if (isLoadingStartedRef.current) {
            console.log('游戏数据已经在加载中，跳过重复加载');
            return;
        }
        
        // 标记加载已开始
        isLoadingStartedRef.current = true;
        
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
                // 使用gameService初始化WebSocket
                gameService.initWebSocketWithData(characterData, map);
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
            // 加载完成后重置标志，允许将来再次加载（例如刷新游戏）
            setTimeout(() => {
                isLoadingStartedRef.current = false;
            }, 1000);
        }
    };
    
    // 使用useEffect在组件挂载时加载游戏数据
    useEffect(() => {
        loadGameData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // WebSocket初始化函数，使用gameService
    const initWebSocketWithData = (characterData, mapData) => {
        gameService.initWebSocketWithData(characterData, mapData);
    };
    
    // 处理其他玩家移动事件
    const handleCharacterMove = (data) => {
        console.log('处理角色移动事件，原始数据:', data);
        
        // 处理不同格式的事件数据
        let characterData = null;
        
        // 处理game.event类型的事件
        if (data.type === 'character.move' && data.data && data.data.character) {
            characterData = data.data.character;
        } 
        // 处理CharacterMoved事件
        else if (data.character) {
            characterData = data.character;
        }
        // 处理简单格式的事件
        else if (data.character_id && data.position_x !== undefined && data.position_y !== undefined) {
            characterData = {
                id: data.character_id,
                position_x: data.position_x,
                position_y: data.position_y
            };
        }
        
        // 如果无法解析数据或是当前玩家自己，则忽略
        if (!characterData || !characterData.id || characterData.id === character?.id) {
            console.log('忽略移动事件:', data);
            return;
        }
        
        console.log('处理角色移动，解析后的数据:', characterData);
        
        // 更新其他玩家列表中的位置
        setOtherPlayers(prev => {
            // 检查玩家是否已经在列表中
            const playerExists = prev.some(player => player.id === characterData.id);
            
            if (playerExists) {
                // 更新现有玩家位置
                return prev.map(player => {
                    if (player.id === characterData.id) {
                        return {
                            ...player,
                            position_x: characterData.position_x,
                            position_y: characterData.position_y
                        };
                    }
                    return player;
                });
            } else {
                // 如果玩家不在列表中，添加新玩家
                console.log('添加新玩家到列表:', characterData);
                return [...prev, {
                    id: characterData.id,
                    name: characterData.name || `玩家${characterData.id}`,
                    position_x: characterData.position_x,
                    position_y: characterData.position_y,
                    level: characterData.level || 1
                }];
            }
        });
    };
    
    // 处理其他玩家进入事件
    const handleCharacterEnter = (data) => {
        if (!data || !data.character || !data.character.id || data.character.id === character?.id) {
            console.log('忽略无效或自己的角色进入事件');
            return;
        }
        
        // 添加防抖处理，避免短时间内重复处理同一角色的进入事件
        const now = Date.now();
        const lastEnterTime = characterEnterTimes.current[data.character.id] || 0;
        if (now - lastEnterTime < 2000) { // 2秒内不重复处理
            console.log('忽略重复的角色进入事件');
            return;
        }
        characterEnterTimes.current[data.character.id] = now;
        
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
    
    // 添加消息，优化防止短时间内添加重复消息
    const addMessage = (message, type = 'info') => {
        // 检查是否是最近2秒内的重复消息
        const now = Date.now();
        const messageKey = `${message}-${type}`;
        const lastTime = recentMessagesRef.current[messageKey] || 0;
        
        if (now - lastTime < 2000) {
            console.log('忽略重复消息:', message);
            return;
        }
        
        // 记录这条消息的时间
        recentMessagesRef.current[messageKey] = now;
        
        // 添加消息到状态
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
                                <h3>${shop.name} <span class="player-gold">您的金币: ${character.gold}</span></h3>
                                <span class="close-btn">&times;</span>
                            </div>
                            <div class="shop-modal-body">
                                <div class="shop-items">
                                    ${shopItems.length > 0 ? 
                                        shopItems.map(item => {
                                            // 判断是否有足够的金币购买不同数量的物品
                                            const canAfford1 = character.gold >= item.price;
                                            const canAfford10 = character.gold >= (item.price * 10);
                                            const canAfford100 = character.gold >= (item.price * 100);
                                            
                                            // 判断是否为消耗品，确保item.item存在
                                            const isConsumable = item.item && item.item.is_consumable ? true : false;
                                            
                                            // 数量选择按钮
                                            const quantityButtons = isConsumable ? 
                                                `<div class="quantity-selector">
                                                    <div class="quantity-label">数量:</div>
                                                    <div class="quantity-buttons">
                                                        <button class="quantity-btn selected" data-quantity="1">X1</button>
                                                        <button class="quantity-btn ${!canAfford10 ? 'disabled' : ''}" data-quantity="10">X10</button>
                                                        <button class="quantity-btn ${!canAfford100 ? 'disabled' : ''}" data-quantity="100">X100</button>
                                                    </div>
                                                </div>` : '';
                                            
                                            // 获取物品名称和类型，确保item.item存在
                                            const itemName = item.item ? item.item.name : '未知物品';
                                            const itemType = item.item ? item.item.type : '未知类型';
                                            const itemDesc = item.item ? (item.item.description || '无描述') : '无描述';
                                            const itemIcon = itemName.charAt(0);
                                            
                                            return `
                                                <div class="shop-item ${canAfford1 ? 'can-afford' : 'cannot-afford'}" 
                                                    data-item-id="${item.item_id}" 
                                                    data-shop-item-id="${item.id}" 
                                                    data-price="${item.price}"
                                                    data-is-consumable="${isConsumable}">
                                                    <div class="shop-item-header">
                                                        <div class="shop-item-icon">${itemIcon}</div>
                                                        <div class="shop-item-title">
                                                            <div class="shop-item-name">${itemName}</div>
                                                            <div class="shop-item-type">${itemType}</div>
                                                        </div>
                                                    </div>
                                                    <div class="shop-item-details">
                                                        <div class="shop-item-description">${itemDesc}</div>
                                                        <div class="shop-item-price">价格: ${item.price} 金币</div>
                                                    </div>
                                                    ${quantityButtons}
                                                    <button class="buy-btn ${!canAfford1 ? 'disabled' : ''}" 
                                                        data-shop-item-id="${item.id}" 
                                                        ${!canAfford1 ? 'title="金币不足"' : ''}>购买</button>
                                                </div>
                                            `;
                                        }).join('') : 
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
                    
                    // 添加数量选择按钮事件
                    const quantityBtns = shopModal.querySelectorAll('.quantity-btn');
                    quantityBtns.forEach(btn => {
                        btn.addEventListener('click', () => {
                            // 如果按钮被禁用，不执行任何操作
                            if (btn.classList.contains('disabled')) {
                                return;
                            }
                            
                            // 获取商品元素
                            const shopItem = btn.closest('.shop-item');
                            if (!shopItem) return;
                            
                            // 移除其他按钮的选中状态
                            shopItem.querySelectorAll('.quantity-btn').forEach(b => {
                                b.classList.remove('selected');
                            });
                            
                            // 设置当前按钮为选中状态
                            btn.classList.add('selected');
                            
                            // 获取价格和数量
                            const price = parseInt(shopItem.dataset.price);
                            const quantity = parseInt(btn.dataset.quantity);
                            const totalPrice = price * quantity;
                            
                            // 更新价格显示
                            const priceEl = shopItem.querySelector('.shop-item-price');
                            if (priceEl) {
                                if (quantity > 1) {
                                    priceEl.innerHTML = `价格: ${price} 金币 × ${quantity} = ${totalPrice} 金币`;
                                } else {
                                    priceEl.innerHTML = `价格: ${price} 金币`;
                                }
                            }
                            
                            // 更新购买按钮状态
                            const buyBtn = shopItem.querySelector('.buy-btn');
                            if (buyBtn) {
                                const canAfford = character.gold >= totalPrice;
                                
                                if (canAfford) {
                                    buyBtn.classList.remove('disabled');
                                    buyBtn.removeAttribute('title');
                                } else {
                                    buyBtn.classList.add('disabled');
                                    buyBtn.setAttribute('title', '金币不足');
                                }
                            }
                        });
                    });
                    
                    // 添加购买按钮事件
                    const buyBtns = shopModal.querySelectorAll('.buy-btn');
                    buyBtns.forEach(btn => {
                        btn.addEventListener('click', async () => {
                            // 如果按钮被禁用，不执行任何操作
                            if (btn.classList.contains('disabled')) {
                                return;
                            }
                            
                            const shopItemId = btn.dataset.shopItemId;
                            const shopItem = btn.closest('.shop-item');
                            
                            // 获取选中的数量
                            let quantity = 1;
                            if (shopItem && shopItem.dataset.isConsumable === 'true') {
                                const selectedQuantityBtn = shopItem.querySelector('.quantity-btn.selected');
                                if (selectedQuantityBtn) {
                                    quantity = parseInt(selectedQuantityBtn.dataset.quantity);
                                }
                            }
                            
                            try {
                                const buyResponse = await axios.post('/api/shop/buy', { 
                                    shop_item_id: shopItemId,
                                    quantity: quantity
                                });
                                
                                if (buyResponse.data.success) {
                                    addMessage(buyResponse.data.message || '购买成功', 'success');
                                    
                                    // 更新角色信息
                                    if (buyResponse.data.character) {
                                        setCharacter(buyResponse.data.character);
                                    }
                                    
                                    // 更新金币显示
                                    const goldSpan = shopModal.querySelector('.player-gold');
                                    if (goldSpan) {
                                        goldSpan.textContent = `您的金币: ${buyResponse.data.current_gold}`;
                                    }
                                    
                                    // 更新物品列表
                                    if (buyResponse.data.inventory) {
                                        setInventory(buyResponse.data.inventory);
                                    }
                                    
                                    // 更新商店物品的可购买状态
                                    updateShopItemsAffordability(shopModal, buyResponse.data.current_gold);
                                } else {
                                    addMessage(buyResponse.data.message || '购买失败', 'error');
                                }
                            } catch (error) {
                                console.error('购买物品失败:', error);
                                addMessage('购买物品失败，请稍后再试', 'error');
                            }
                        });
                    });
                } else {
                    addMessage(response.data.message || '无法加载商店数据', 'error');
                }
            } catch (error) {
                console.error('加载商店数据出错:', error);
                addMessage('加载商店数据时出错', 'error');
            }
        }
    };
    
    // 更新商店物品的可购买状态
    const updateShopItemsAffordability = (shopModal, currentGold) => {
        const shopItems = shopModal.querySelectorAll('.shop-item');
        shopItems.forEach(item => {
            const price = parseInt(item.dataset.price || 0);
            const isConsumable = item.dataset.isConsumable === 'true';
            
            // 获取当前选中的数量
            const selectedQuantityBtn = item.querySelector('.quantity-btn.selected');
            const quantity = selectedQuantityBtn ? parseInt(selectedQuantityBtn.dataset.quantity) : 1;
            
            // 计算总价
            const totalPrice = price * quantity;
            
            // 判断是否有足够的金币
            const canAfford = currentGold >= totalPrice;
            
            // 更新样式类
            if (canAfford) {
                item.classList.remove('cannot-afford');
                item.classList.add('can-afford');
                
                // 更新价格显示
                const priceEl = item.querySelector('.shop-item-price');
                if (priceEl) {
                    if (quantity > 1) {
                        priceEl.innerHTML = `价格: ${price} 金币 × ${quantity} = ${totalPrice} 金币`;
                    } else {
                        priceEl.innerHTML = `价格: ${price} 金币`;
                    }
                }
                
                // 更新按钮
                const buyBtn = item.querySelector('.buy-btn');
                if (buyBtn) {
                    buyBtn.classList.remove('disabled');
                    buyBtn.removeAttribute('title');
                }
            } else {
                item.classList.remove('can-afford');
                item.classList.add('cannot-afford');
                
                // 更新价格显示
                const priceEl = item.querySelector('.shop-item-price');
                if (priceEl) {
                    if (quantity > 1) {
                        priceEl.innerHTML = `价格: ${price} 金币 × ${quantity} = ${totalPrice} 金币 <span class="not-enough">(金币不足)</span>`;
                    } else {
                        priceEl.innerHTML = `价格: ${price} 金币 <span class="not-enough">(金币不足)</span>`;
                    }
                }
                
                // 更新按钮
                const buyBtn = item.querySelector('.buy-btn');
                if (buyBtn) {
                    buyBtn.classList.add('disabled');
                    buyBtn.setAttribute('title', '金币不足');
                }
            }
            
            // 更新数量按钮状态
            if (isConsumable) {
                const quantityBtns = item.querySelectorAll('.quantity-btn');
                quantityBtns.forEach(btn => {
                    const btnQuantity = parseInt(btn.dataset.quantity);
                    const btnTotalPrice = price * btnQuantity;
                    const canAffordBtn = currentGold >= btnTotalPrice;
                    
                    if (canAffordBtn) {
                        btn.classList.remove('disabled');
                    } else {
                        btn.classList.add('disabled');
                    }
                });
            }
        });
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
                                    current_map_id: teleport.target_map_id,
                                    position_x: teleport.target_x || teleport.target_position_x || 0,
                                    position_y: teleport.target_y || teleport.target_position_y || 0
                                };
                                
                                // 使用新的函数初始化WebSocket
                                gameService.initWebSocketWithData(updatedCharacter, map);
                            }, 500); // 增加延迟时间，确保旧连接完全清除
                            
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
            // 保存原始位置，以便在移动失败时回滚
            const originalX = character?.position_x;
            const originalY = character?.position_y;
            
            // 立即更新本地角色位置（提供即时视觉反馈）
            if (character) {
                setCharacter(prev => ({
                    ...prev,
                    position_x: x,
                    position_y: y
                }));
            }
            
            // 添加点击位置的视觉效果
            const clickEffect = document.createElement('div');
            clickEffect.style.position = 'absolute';
            clickEffect.style.left = `${x}px`;
            clickEffect.style.top = `${y}px`;
            clickEffect.style.width = '20px';
            clickEffect.style.height = '20px';
            clickEffect.style.borderRadius = '50%';
            clickEffect.style.backgroundColor = 'rgba(100, 149, 237, 0.5)';
            clickEffect.style.transform = 'translate(-50%, -50%)';
            clickEffect.style.zIndex = '5';
            clickEffect.style.pointerEvents = 'none'; // 确保不会干扰点击
            clickEffect.style.animation = 'clickFadeOut 1s forwards';
            
            // 添加动画样式
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                @keyframes clickFadeOut {
                    0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.5); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
                }
            `;
            document.head.appendChild(styleElement);
            
            // 将效果添加到地图
            const gameMap = document.querySelector('.game-map');
            if (gameMap) {
                gameMap.appendChild(clickEffect);
                
                // 动画结束后移除元素
                setTimeout(() => {
                    clickEffect.remove();
                    styleElement.remove();
                }, 1000);
            }
            
            // 调用API
            const response = await axios.post('/api/character/move', {
                position_x: x,
                position_y: y
            });
            
            if (response.data.success) {
                console.log('移动成功:', response.data);
                // 可以在这里更新角色状态，但我们已经在前面更新了
            } else {
                console.error('移动失败:', response.data.message);
                addMessage(`移动失败: ${response.data.message}`, 'error');
                
                // 如果服务器拒绝移动，恢复原始位置
                if (response.data.character) {
                    setCharacter(response.data.character);
                } else if (originalX !== undefined && originalY !== undefined) {
                    // 如果没有返回角色数据，使用保存的原始位置
                    setCharacter(prev => ({
                        ...prev,
                        position_x: originalX,
                        position_y: originalY
                    }));
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
            
            const response = await axios.post('/api/item/use', { character_item_id: itemId });
            
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
        
        // 使用gameService初始化WebSocket
        gameService.initWebSocketWithData(character, currentMap);
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