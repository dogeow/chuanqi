import axios from 'axios';
import useGameStore from '../store/gameStore';

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
            gameStore.setLoading(true);
            gameStore.addMessage('正在加载角色数据...', 'info');
            
            // 获取角色信息
            const characterResponse = await axios.get('/api/character');
            if (!characterResponse.data.success) {
                throw new Error(characterResponse.data.message || '获取角色数据失败');
            }
            
            const characterData = characterResponse.data.character;
            // 确保同时设置x和y属性
            if (characterData.position_x !== undefined && characterData.position_y !== undefined) {
                characterData.x = characterData.position_x;
                characterData.y = characterData.position_y;
            }
            gameStore.setCharacter(characterData);
            
            gameStore.addMessage('正在加载地图数据...', 'info');
            
            // 检查角色的地图ID是否存在
            if (!characterData.map_id) {
                console.error('角色没有地图ID，使用默认地图ID 1');
                characterData.map_id = 1; // 设置默认地图ID
                gameStore.addMessage('无法获取角色当前地图，使用默认地图', 'warning');
            }
            
            // 获取地图信息
            const mapResponse = await axios.get(`/api/map/${characterData.map_id}`);
            if (!mapResponse.data.success) {
                throw new Error(mapResponse.data.message || '获取地图数据失败');
            }
            
            const mapData = mapResponse.data.map;
            gameStore.setGameData(mapResponse.data);
            
            // 获取背包信息
            gameStore.addMessage('正在加载背包数据...', 'info');
            const inventoryResponse = await axios.get('/api/inventory');
            if (!inventoryResponse.data.success) {
                throw new Error(inventoryResponse.data.message || '获取背包数据失败');
            }
            
            gameStore.setInventory(inventoryResponse.data.inventory || []);
            
            // 初始化WebSocket连接
            this.initWebSocketWithData(characterData, mapData);
            
            gameStore.addMessage('游戏数据加载完成！', 'success');
            gameStore.setLoading(false);
        } catch (error) {
            console.error('加载游戏数据失败:', error);
            gameStore.addMessage(`加载游戏数据失败: ${error.message}`, 'error');
            gameStore.setLoading(false);
        }
    }
    
    // 初始化WebSocket连接（带数据）
    initWebSocketWithData(characterData, mapData) {
        const gameStore = useGameStore.getState();
        
        if (!window.Echo) {
            console.error('Echo未初始化');
            gameStore.addMessage('无法初始化实时通信，部分功能可能不可用', 'error');
            return;
        }
        
        if (!mapData || !mapData.id) {
            console.error('地图数据无效，无法初始化WebSocket连接');
            gameStore.addMessage('无法连接到游戏服务器，部分功能可能不可用', 'error');
            return;
        }
        
        console.log(`正在连接到地图频道: map.${mapData.id}`);
        
        try {
            // 订阅地图频道
            window.Echo.join(`map.${mapData.id}`)
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
                    this.handleCharacterMove(data);
                })
                .listen('CharacterEntered', (data) => {
                    this.handleCharacterEnter(data);
                })
                .listen('CharacterLeft', (data) => {
                    this.handleCharacterLeave(data);
                })
                .listen('MonsterKilled', (data) => {
                    this.handleMonsterKilled(data);
                })
                .listen('MonsterRespawning', (data) => {
                    this.handleMonsterRespawning(data);
                })
                .listen('MonsterRespawned', (data) => {
                    this.handleMonsterRespawned(data);
                })
                .error((error) => {
                    console.error('WebSocket连接错误:', error);
                    gameStore.addMessage('与游戏服务器的连接出现问题，请刷新页面', 'error');
                });
                
            gameStore.addMessage(`已连接到地图 ${mapData.name}`, 'info');
        } catch (error) {
            console.error('初始化WebSocket连接失败:', error);
            gameStore.addMessage('无法连接到游戏服务器，请检查网络连接', 'error');
        }
    }
    
    // 处理角色移动事件
    handleCharacterMove(data) {
        const gameStore = useGameStore.getState();
        
        if (data.character_id === gameStore.character?.id) {
            return; // 忽略自己的移动事件
        }
        
        gameStore.updateOtherPlayerPosition(data.character_id, data.position_x, data.position_y);
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
        
        gameStore.updateMonster(data.monster_id, { is_dead: true, respawn_time: data.respawn_time });
        
        // 如果是当前正在自动攻击的怪物，停止自动攻击
        if (gameStore.currentAttackingMonsterId === data.monster_id) {
            this.stopAutoAttack();
        }
        
        // 如果是自己击杀的，更新经验和金币
        if (data.killer_id === gameStore.character?.id) {
            gameStore.updateCharacterAttributes({
                experience: data.new_experience,
                gold: data.new_gold,
                level: data.new_level || gameStore.character.level
            });
            
            gameStore.addMessage(`你击杀了 ${data.monster_name}，获得了 ${data.experience_gained} 经验和 ${data.gold_gained} 金币！`, 'success');
            
            // 如果升级了
            if (data.new_level && data.new_level > gameStore.character.level) {
                gameStore.addMessage(`恭喜！你升级到了 ${data.new_level} 级！`, 'success');
            }
        }
    }
    
    // 处理怪物即将重生事件
    handleMonsterRespawning(data) {
        const gameStore = useGameStore.getState();
        gameStore.addMessage(`${data.monster_name} 即将在 ${data.respawn_seconds} 秒后重生`, 'info');
    }
    
    // 处理怪物重生事件
    handleMonsterRespawned(data) {
        const gameStore = useGameStore.getState();
        
        gameStore.updateMonster(data.monster.id, { 
            ...data.monster, 
            is_dead: false, 
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
            const characterX = character.x || character.position_x || 0;
            const characterY = character.y || character.position_y || 0;
            const monsterX = monster.x || monster.position_x || 0;
            const monsterY = monster.y || monster.position_y || 0;
            
            const dx = characterX - monsterX;
            const dy = characterY - monsterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果距离太远，先移动到怪物附近
            if (distance > 2) {
                // 计算移动目标点（怪物附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = monsterX + Math.round(Math.cos(angle));
                const targetY = monsterY + Math.round(Math.sin(angle));
                
                // 移动到目标点
                await this.moveCharacter(targetX, targetY);
                
                // 开始自动攻击
                this.startAutoAttack(monsterId);
                return;
            }
            
            // 如果已经在攻击范围内，直接攻击
            const response = await axios.post('/api/monster/attack', {
                monster_id: monsterId
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '攻击失败');
            }
            
            // 更新怪物血量
            gameStore.updateMonster(monsterId, { current_hp: response.data.monster.current_hp });
            
            // 如果怪物被击杀
            if (response.data.monster.current_hp <= 0) {
                // handleMonsterKilled 会通过WebSocket事件处理
                return;
            }
            
            // 开始自动攻击
            this.startAutoAttack(monsterId);
            
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
            const characterX = character.x || character.position_x || 0;
            const characterY = character.y || character.position_y || 0;
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
            
            // 创建商店模态框
            const shopModal = document.createElement('div');
            shopModal.className = 'shop-modal';
            shopModal.innerHTML = `
                <div class="shop-modal-content">
                    <div class="shop-modal-header">
                        <h3>${shop.name}</h3>
                        <button class="close-btn">×</button>
                    </div>
                    <div class="shop-modal-body">
                        <div class="shop-items">
                            ${shopItems.map(item => `
                                <div class="shop-item" data-id="${item.id}">
                                    <img src="${item.item.image || '/images/items/default.png'}" alt="${item.item.name}">
                                    <div class="shop-item-info">
                                        <div class="shop-item-name">${item.item.name}</div>
                                        <div class="shop-item-price">${item.price} 金币</div>
                                    </div>
                                    ${item.item.is_consumable ? `
                                        <div class="buy-quantity-buttons">
                                            <button class="buy-btn" data-id="${item.id}" data-quantity="1" ${item.price > character.gold ? 'disabled' : ''}>X1</button>
                                            <button class="buy-btn" data-id="${item.id}" data-quantity="10" ${item.price * 10 > character.gold ? 'disabled' : ''}>X10</button>
                                            <button class="buy-btn" data-id="${item.id}" data-quantity="100" ${item.price * 100 > character.gold ? 'disabled' : ''}>X100</button>
                                        </div>
                                    ` : `
                                        <button class="buy-btn" data-id="${item.id}" data-quantity="1" ${item.price > character.gold ? 'disabled' : ''}>购买</button>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(shopModal);
            
            // 更新商品可购买状态
            this.updateShopItemsAffordability(shopModal, character.gold);
            
            // 添加关闭按钮事件
            const closeBtn = shopModal.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(shopModal);
            });
            
            // 添加购买按钮事件
            const buyBtns = shopModal.querySelectorAll('.buy-btn');
            buyBtns.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const itemId = btn.getAttribute('data-id');
                    const quantity = parseInt(btn.getAttribute('data-quantity') || 1);
                    try {
                        await this.buyItem(itemId, quantity);
                        
                        // 更新商品可购买状态
                        this.updateShopItemsAffordability(shopModal, gameStore.character.gold);
                    } catch (error) {
                        console.error('购买物品失败:', error);
                    }
                });
            });
            
        } catch (error) {
            console.error('打开商店失败:', error);
            gameStore.addMessage(`打开商店失败: ${error.message}`, 'error');
        }
    }
    
    // 更新商店物品可购买状态
    updateShopItemsAffordability(shopModal, currentGold) {
        const buyBtns = shopModal.querySelectorAll('.buy-btn');
        buyBtns.forEach(btn => {
            const itemId = btn.getAttribute('data-id');
            const quantity = parseInt(btn.getAttribute('data-quantity') || 1);
            const itemElement = shopModal.querySelector(`.shop-item[data-id="${itemId}"]`);
            const priceElement = itemElement.querySelector('.shop-item-price');
            const priceText = priceElement.textContent;
            const price = parseInt(priceText.match(/\d+/)[0]);
            
            const totalPrice = price * quantity;
            
            if (totalPrice > currentGold) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
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
            const teleport = gameStore.teleportPoints.find(t => t.id === teleportId);
            if (!teleport) {
                throw new Error('传送点不存在');
            }
            
            // 计算角色和传送点之间的距离
            const character = gameStore.character;
            const characterX = character.x || character.position_x || 0;
            const characterY = character.y || character.position_y || 0;
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
            
            // 确认传送
            const confirmTeleport = window.confirm(`确定要传送到 ${teleport.target_map_name} 吗？`);
            if (!confirmTeleport) {
                return;
            }
            
            // 执行传送
            gameStore.addMessage(`正在传送到 ${teleport.target_map_name}...`, 'info');
            
            const response = await axios.post('/api/teleport', {
                teleport_id: teleportId
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
            const mapResponse = await axios.get(`/api/map/${response.data.new_map_id}`);
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
            const currentX = character.x || character.position_x || 0;
            const currentY = character.y || character.position_y || 0;
            
            if (currentX === position_x && currentY === position_y) {
                return;
            }
            
            // 停止自动攻击
            if (gameStore.isAutoAttacking) {
                this.stopAutoAttack();
            }
            
            // 发送移动请求
            const response = await axios.post('/api/character/move', { position_x, position_y });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '移动失败');
            }
            
            // 更新角色位置 - 使用服务器返回的位置
            const newX = response.data.character.position_x;
            const newY = response.data.character.position_y;
            gameStore.updateCharacterPosition(newX, newY);
            
            return true;
        } catch (error) {
            console.error('移动角色失败:', error);
            gameStore.addMessage(`移动失败: ${error.message}`, 'error');
            return false;
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
                item_id: itemId
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
            gameStore.addMessage(`装备物品失败: ${error.message}`, 'error');
        }
    }
    
    // 卸下装备
    async unequipItem(itemId) {
        const gameStore = useGameStore.getState();
        
        try {
            const response = await axios.post('/api/inventory/unequip', {
                item_id: itemId
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
    
    // 初始化WebSocket
    initWebSocket() {
        const gameStore = useGameStore.getState();
        
        if (!window.Echo) {
            console.error('Echo未初始化');
            return;
        }
        
        // 如果已经有角色和地图数据，直接初始化WebSocket
        const { character, currentMap } = gameStore;
        if (character && currentMap) {
            this.initWebSocketWithData(character, currentMap);
        }
    }
}

// 创建单例实例
const gameService = new GameService();

export default gameService; 