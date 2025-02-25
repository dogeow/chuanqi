// 游戏核心类
class Game {
    constructor() {
        this.character = null;
        this.currentMap = null;
        this.monsters = [];
        this.shops = [];
        this.otherPlayers = [];
        
        // 初始化DOM元素引用
        this.initDomElements();
        
        // 加载游戏数据
        this.loadGameData();
    }
    
    // 初始化DOM元素引用
    initDomElements() {
        this.gameMap = document.getElementById('game-map');
        this.player = document.getElementById('player');
        this.characterInfo = document.getElementById('character-details');
        this.skillsList = document.getElementById('skills-list');
        this.inventoryList = document.getElementById('inventory-list');
        this.messages = document.getElementById('messages');
        
        // 检查必要的DOM元素是否存在
        if (this.gameMap && this.player) {
            // 初始化事件监听
            this.initEventListeners();
        } else {
            console.error('游戏DOM元素未找到，请确保HTML结构正确');
            if (this.messages) {
                this.addMessage('游戏初始化失败，请刷新页面重试');
            }
        }
    }
    
    // 初始化事件监听器
    initEventListeners() {
        // 地图点击事件
        if (this.gameMap) {
            this.gameMap.addEventListener('click', (e) => {
                if (e.target === this.gameMap) {
                    this.moveCharacter(e.offsetX, e.offsetY);
                }
            });
        }
        
        // 怪物点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('monster')) {
                this.showMonsterModal(e.target.dataset.monsterId);
            }
        });
        
        // 商店点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('shop')) {
                this.showShopModal(e.target.dataset.shopId);
            }
        });
        
        // 物品点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('item')) {
                this.showItemModal(e.target.dataset.itemId);
            }
        });
        
        // 技能点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('skill')) {
                this.showSkillModal(e.target.dataset.skillId);
            }
        });
        
        // 关闭模态框按钮事件
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
        
        // 攻击怪物按钮事件
        const attackButton = document.getElementById('attack-monster');
        if (attackButton) {
            attackButton.addEventListener('click', () => {
                this.attackMonster();
            });
        }
        
        // 使用技能按钮事件
        const skillButton = document.getElementById('use-skill');
        if (skillButton) {
            skillButton.addEventListener('click', () => {
                this.showSkillSelectModal();
            });
        }
    }
    
    // 初始化WebSocket连接
    initWebSocket() {
        if (!this.currentMap || !this.currentMap.id) {
            console.error('地图数据未加载，无法初始化WebSocket');
            return;
        }
        
        try {
            Echo.join(`map.${this.currentMap.id}`)
                .here((players) => {
                    this.otherPlayers = players;
                    this.updateOtherPlayers();
                })
                .joining((player) => {
                    this.otherPlayers.push(player);
                    this.updateOtherPlayers();
                    this.addMessage(`${player.name} 进入了地图`);
                })
                .leaving((player) => {
                    this.otherPlayers = this.otherPlayers.filter(p => p.id !== player.id);
                    this.updateOtherPlayers();
                    this.addMessage(`${player.name} 离开了地图`);
                })
                .listen('game.event', (event) => {
                    this.handleGameEvent(event);
                });
        } catch (error) {
            console.error('WebSocket连接初始化失败:', error);
            this.addMessage('实时连接失败，部分功能可能不可用');
        }
    }
    
    // 加载游戏数据
    async loadGameData() {
        try {
            // 从localStorage获取token
            console.log('正在检查localStorage中的token...');
            const token = localStorage.getItem('game_token');
            
            // 检查所有localStorage中的键
            console.log('localStorage中的所有键:');
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                console.log(`- ${key}: ${localStorage.getItem(key).substring(0, 10)}...`);
            }
            
            if (!token) {
                console.error('未找到认证令牌，请先登录');
                this.addMessage('未找到认证令牌，请先登录');
                
                
                return;
            }
            
            console.log('使用令牌:', token.substring(0, 10) + '...');
            
            // 设置默认请求头
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // 获取角色信息
            try {
                console.log('正在获取角色信息...');
                const characterResponse = await axios.get('/api/character');
                console.log('角色信息获取成功:', characterResponse.data);
                this.character = characterResponse.data.character;
                
                // 如果有消息，显示给用户
                if (characterResponse.data.message) {
                    this.addMessage(characterResponse.data.message);
                }
                
                if (this.characterInfo) {
                    this.updateCharacterInfo();
                } else {
                    console.error('角色信息容器未找到');
                }
            } catch (error) {
                console.error('获取角色信息失败:', error);
                if (error.response) {
                    console.error('错误状态码:', error.response.status);
                    console.error('错误数据:', error.response.data);
                    
                    if (error.response.status === 401) {
                        console.error('认证失败，令牌可能已过期');
                        localStorage.removeItem('game_token');
                        this.addMessage('登录已过期，请重新登录');
                        window.location.href = '/login';
                        return;
                    }
                }
                this.addMessage('获取角色信息失败');
                return; // 如果无法获取角色信息，停止加载其他数据
            }
            
            // 获取地图信息
            try {
                const mapResponse = await axios.get(`/api/map/${this.character.current_map_id}`);
                this.currentMap = mapResponse.data.map;
                this.monsters = mapResponse.data.monsters;
                this.otherPlayers = mapResponse.data.otherPlayers;
                if (this.gameMap) {
                    this.updateMap();
                } else {
                    console.error('地图容器未找到');
                }
                
                // 初始化WebSocket连接
                this.initWebSocket();
            } catch (error) {
                console.error('获取地图信息失败:', error);
                this.addMessage('获取地图信息失败');
            }
            
            // 获取技能列表
            try {
                const skillsResponse = await axios.get('/api/skills');
                if (this.skillsList) {
                    this.updateSkillsList(skillsResponse.data.skills);
                } else {
                    console.error('技能列表容器未找到');
                }
            } catch (error) {
                console.error('获取技能列表失败:', error);
                this.addMessage('获取技能列表失败');
            }
            
            // 获取背包信息
            try {
                const inventoryResponse = await axios.get('/api/inventory');
                if (this.inventoryList) {
                    this.updateInventoryList(inventoryResponse.data.inventory);
                } else {
                    console.error('背包列表容器未找到');
                }
            } catch (error) {
                console.error('获取背包信息失败:', error);
                this.addMessage('获取背包信息失败');
            }
            
            // 获取商店信息
            try {
                const shopsResponse = await axios.get(`/api/shops/map/${this.character.current_map_id}`);
                this.shops = shopsResponse.data.shops;
                if (this.gameMap) {
                    this.updateShops();
                } else {
                    console.error('地图容器未找到，无法显示商店');
                }
            } catch (error) {
                console.error('获取商店信息失败:', error);
                this.addMessage('获取商店信息失败');
            }
        } catch (error) {
            console.error('加载游戏数据失败:', error);
            if (error.response && error.response.status === 401) {
                alert('登录已过期，请重新登录');
                localStorage.removeItem('game_token');
            } else {
                alert('加载游戏数据失败，请重新登录');
            }
            window.location.href = '/login';
        }
    }
    
    // 更新角色信息显示
    updateCharacterInfo() {
        if (!this.characterInfo || !this.character) {
            console.error('角色信息容器或数据未找到，无法更新角色信息');
            return;
        }
        
        // 计算升级所需经验
        const expToLevel = this.character.exp_to_level || (this.character.level * 100);
        
        this.characterInfo.innerHTML = `
            <p>名称：${this.character.name}</p>
            <p>等级：${this.character.level}</p>
            <p>经验：${this.character.exp}/${expToLevel}</p>
            <p>生命：${this.character.current_hp}/${this.character.max_hp}</p>
            <p>魔法：${this.character.current_mp}/${this.character.max_mp}</p>
            <p>攻击：${this.character.attack}</p>
            <p>防御：${this.character.defense}</p>
            <p>金币：${this.character.gold || 0}</p>
            <p>位置：(${this.character.position_x}, ${this.character.position_y})</p>
        `;
    }
    
    // 更新地图显示
    updateMap() {
        if (!this.gameMap) {
            console.error('地图容器未找到，无法更新地图');
            return;
        }
        
        // 更新地图大小
        this.gameMap.style.width = `${this.currentMap.width}px`;
        this.gameMap.style.height = `${this.currentMap.height}px`;
        
        // 更新角色位置
        this.updatePlayerPosition();
        
        // 更新怪物
        this.updateMonsters();
        
        // 更新其他玩家
        this.updateOtherPlayers();
        
        // 更新商店
        this.updateShops();
    }
    
    // 更新角色位置
    updatePlayerPosition() {
        if (!this.player || !this.character) {
            console.error('角色元素或数据未找到，无法更新位置');
            return;
        }
        
        // 确保使用正确的属性名
        const x = this.character.position_x;
        const y = this.character.position_y;
        
        if (x !== undefined && y !== undefined) {
            this.player.style.left = `${x}px`;
            this.player.style.top = `${y}px`;
        } else {
            console.error('角色位置数据不完整:', this.character);
        }
    }
    
    // 更新怪物显示
    updateMonsters() {
        if (!this.gameMap || !this.monsters) {
            console.error('地图容器或怪物数据未找到，无法更新怪物');
            return;
        }
        
        // 清除现有怪物
        document.querySelectorAll('.monster').forEach(monster => monster.remove());
        
        // 添加怪物
        this.monsters.forEach(monster => {
            const monsterElement = document.createElement('div');
            monsterElement.className = 'monster';
            monsterElement.dataset.monsterId = monster.id;
            monsterElement.style.left = `${monster.position_x}px`;
            monsterElement.style.top = `${monster.position_y}px`;
            monsterElement.innerHTML = monster.name;
            this.gameMap.appendChild(monsterElement);
        });
    }
    
    // 更新其他玩家显示
    updateOtherPlayers() {
        if (!this.gameMap || !this.otherPlayers || !this.character) {
            console.error('地图容器或玩家数据未找到，无法更新其他玩家');
            return;
        }
        
        // 清除现有其他玩家
        document.querySelectorAll('.other-player').forEach(player => player.remove());
        
        // 添加其他玩家
        this.otherPlayers.forEach(player => {
            if (player.id !== this.character.id) {
                const playerElement = document.createElement('div');
                playerElement.className = 'player other-player';
                playerElement.dataset.playerId = player.id;
                playerElement.style.left = `${player.position_x}px`;
                playerElement.style.top = `${player.position_y}px`;
                playerElement.innerHTML = player.name;
                this.gameMap.appendChild(playerElement);
            }
        });
    }
    
    // 更新商店显示
    updateShops() {
        if (!this.gameMap || !this.shops) {
            console.error('地图容器或商店数据未找到，无法更新商店');
            return;
        }
        
        // 清除现有商店
        document.querySelectorAll('.shop').forEach(shop => shop.remove());
        
        // 添加商店
        this.shops.forEach(shop => {
            const shopElement = document.createElement('div');
            shopElement.className = 'shop';
            shopElement.dataset.shopId = shop.id;
            shopElement.style.left = `${shop.position_x}px`;
            shopElement.style.top = `${shop.position_y}px`;
            shopElement.innerHTML = shop.name;
            this.gameMap.appendChild(shopElement);
        });
    }
    
    // 更新技能列表
    updateSkillsList(skills) {
        if (!this.skillsList) {
            console.error('技能列表容器未找到，无法更新技能列表');
            return;
        }
        
        if (!skills || !skills.length) {
            this.skillsList.innerHTML = '<p>暂无技能</p>';
            return;
        }
        
        this.skills = skills; // 保存技能列表引用
        
        this.skillsList.innerHTML = skills.map(skill => `
            <div class="skill" data-skill-id="${skill.id}">
                <div class="skill-icon">${skill.skill.icon || '技'}</div>
                <div class="skill-info">
                    <div>${skill.skill.name} Lv.${skill.level}</div>
                    <div>MP消耗：${skill.skill.mp_cost}</div>
                </div>
            </div>
        `).join('');
    }
    
    // 更新背包列表
    updateInventoryList(inventory) {
        if (!this.inventoryList) {
            console.error('背包列表容器未找到，无法更新背包列表');
            return;
        }
        
        if (!inventory || !inventory.length) {
            this.inventoryList.innerHTML = '<p>背包为空</p>';
            return;
        }
        
        this.inventory = inventory; // 保存背包列表引用
        
        this.inventoryList.innerHTML = inventory.map(item => `
            <div class="item" data-item-id="${item.id}">
                <div class="item-icon">${item.item.image || '物'}</div>
                <div class="item-info">
                    <div>${item.item.name} x${item.quantity}</div>
                    <div>${item.is_equipped ? '已装备' : ''}</div>
                </div>
            </div>
        `).join('');
    }
    
    // 移动角色
    async moveCharacter(x, y) {
        try {
            console.log(`尝试移动角色到位置: (${x}, ${y})`);
            const response = await axios.post('/api/character/move', { 
                x: x, 
                y: y 
            });
            console.log('移动成功，服务器响应:', response.data);
            this.character = response.data.character;
            this.updatePlayerPosition();
        } catch (error) {
            console.error('移动失败:', error);
            if (error.response) {
                console.error('错误状态码:', error.response.status);
                console.error('错误数据:', error.response.data);
            }
            this.addMessage('移动失败');
        }
    }
    
    // 显示怪物模态框
    async showMonsterModal(monsterId) {
        const monster = this.monsters.find(m => m.id === parseInt(monsterId));
        if (!monster) return;
        
        document.getElementById('monster-name').textContent = monster.name;
        document.getElementById('monster-details').innerHTML = `
            <p>等级：${monster.level}</p>
            <p>生命：${monster.current_hp}/${monster.hp}</p>
            <p>攻击：${monster.attack}</p>
            <p>防御：${monster.defense}</p>
        `;
        
        document.getElementById('monster-modal').style.display = 'block';
        document.getElementById('monster-modal').dataset.monsterId = monsterId;
    }
    
    // 显示商店模态框
    async showShopModal(shopId) {
        try {
            const response = await axios.get(`/api/shop/${shopId}`);
            const shop = response.data.shop;
            const shopItems = response.data.shop_items;
            
            document.getElementById('shop-name').textContent = shop.name;
            document.getElementById('shop-items').innerHTML = shopItems.map(item => `
                <div class="item" data-shop-item-id="${item.id}">
                    <div class="item-icon">${item.item.image || '物'}</div>
                    <div class="item-info">
                        <div>${item.item.name}</div>
                        <div>价格：${item.price}金币</div>
                    </div>
                    <button class="btn" onclick="game.buyItem(${item.id})">购买</button>
                </div>
            `).join('');
            
            document.getElementById('shop-modal').style.display = 'block';
        } catch (error) {
            console.error('获取商店信息失败:', error);
            this.addMessage('获取商店信息失败');
        }
    }
    
    // 显示物品模态框
    showItemModal(itemId) {
        const inventoryItem = this.inventory.find(i => i.id === parseInt(itemId));
        if (!inventoryItem) return;
        
        document.getElementById('item-name').textContent = inventoryItem.item.name;
        document.getElementById('item-details').innerHTML = `
            <p>${inventoryItem.item.description}</p>
            <p>数量：${inventoryItem.quantity}</p>
        `;
        
        const actions = [];
        if (inventoryItem.item.is_consumable) {
            actions.push(`<button class="btn" onclick="game.useItem(${itemId})">使用</button>`);
        }
        if (inventoryItem.item.type === 'equipment') {
            if (inventoryItem.equipped) {
                actions.push(`<button class="btn" onclick="game.unequipItem(${itemId})">卸下</button>`);
            } else {
                actions.push(`<button class="btn" onclick="game.equipItem(${itemId})">装备</button>`);
            }
        }
        actions.push(`<button class="btn" onclick="game.dropItem(${itemId})">丢弃</button>`);
        
        document.getElementById('item-actions').innerHTML = actions.join('');
        document.getElementById('item-modal').style.display = 'block';
    }
    
    // 显示技能选择模态框
    showSkillSelectModal() {
        const monsterId = document.getElementById('monster-modal').dataset.monsterId;
        
        document.getElementById('skill-select-list').innerHTML = this.skills.map(skill => `
            <div class="skill" onclick="game.useSkill(${skill.id}, ${monsterId})">
                <div class="skill-icon">${skill.skill.icon || '技'}</div>
                <div class="skill-info">
                    <div>${skill.skill.name} Lv.${skill.level}</div>
                    <div>MP消耗：${skill.skill.mp_cost}</div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('skill-select-modal').style.display = 'block';
    }
    
    // 攻击怪物
    async attackMonster() {
        const monsterId = document.getElementById('monster-modal').dataset.monsterId;
        try {
            const response = await axios.post('/api/monster/attack', { monster_id: monsterId });
            this.handleCombatResult(response.data);
        } catch (error) {
            console.error('攻击失败:', error);
            this.addMessage('攻击失败');
        }
    }
    
    // 使用技能
    async useSkill(skillId, monsterId) {
        try {
            const response = await axios.post('/api/skill/use', {
                skill_id: skillId,
                monster_id: monsterId
            });
            this.handleCombatResult(response.data);
            document.getElementById('skill-select-modal').style.display = 'none';
        } catch (error) {
            console.error('使用技能失败:', error);
            this.addMessage('使用技能失败');
        }
    }
    
    // 购买物品
    async buyItem(shopItemId) {
        try {
            const response = await axios.post('/api/shop/buy', {
                shop_item_id: shopItemId,
                quantity: 1
            });
            this.character = response.data.character;
            this.updateCharacterInfo();
            this.updateInventoryList(response.data.inventory);
            this.addMessage(response.data.message);
        } catch (error) {
            console.error('购买失败:', error);
            this.addMessage('购买失败');
        }
    }
    
    // 使用物品
    async useItem(itemId) {
        try {
            const response = await axios.post('/api/item/use', {
                character_item_id: itemId
            });
            this.character = response.data.character;
            this.updateCharacterInfo();
            this.updateInventoryList(response.data.inventory);
            this.addMessage(response.data.message);
            document.getElementById('item-modal').style.display = 'none';
        } catch (error) {
            console.error('使用物品失败:', error);
            this.addMessage('使用物品失败');
        }
    }
    
    // 装备物品
    async equipItem(itemId) {
        try {
            const response = await axios.post('/api/item/equip', {
                character_item_id: itemId
            });
            this.character = response.data.character;
            this.updateCharacterInfo();
            this.updateInventoryList(response.data.inventory);
            this.addMessage(response.data.message);
            document.getElementById('item-modal').style.display = 'none';
        } catch (error) {
            console.error('装备物品失败:', error);
            this.addMessage('装备物品失败');
        }
    }
    
    // 卸下物品
    async unequipItem(itemId) {
        try {
            const response = await axios.post('/api/item/unequip', {
                character_item_id: itemId
            });
            this.character = response.data.character;
            this.updateCharacterInfo();
            this.updateInventoryList(response.data.inventory);
            this.addMessage(response.data.message);
            document.getElementById('item-modal').style.display = 'none';
        } catch (error) {
            console.error('卸下物品失败:', error);
            this.addMessage('卸下物品失败');
        }
    }
    
    // 丢弃物品
    async dropItem(itemId) {
        const quantity = 1; // 可以改为弹窗输入数量
        try {
            const response = await axios.post('/api/item/drop', {
                character_item_id: itemId,
                quantity
            });
            this.updateInventoryList(response.data.inventory);
            this.addMessage(response.data.message);
            document.getElementById('item-modal').style.display = 'none';
        } catch (error) {
            console.error('丢弃物品失败:', error);
            this.addMessage('丢弃物品失败');
        }
    }
    
    // 处理战斗结果
    handleCombatResult(result) {
        if (result.success) {
            this.character = result.character;
            this.updateCharacterInfo();
            
            let message = `对怪物造成${result.damage}点伤害`;
            if (result.monster_killed) {
                message += `，击杀怪物获得${result.exp_gained}经验和${result.gold_gained}金币`;
                if (result.leveled_up) {
                    message += `，升级到${result.new_level}级！`;
                }
            }
            this.addMessage(message);
            
            if (result.monster_killed) {
                document.getElementById('monster-modal').style.display = 'none';
            }
        }
    }
    
    // 处理游戏事件
    handleGameEvent(event) {
        switch (event.type) {
            case 'character.move':
                this.handleCharacterMove(event.data);
                break;
            case 'character.enter':
                this.handleCharacterEnter(event.data);
                break;
            case 'character.leave':
                this.handleCharacterLeave(event.data);
                break;
            case 'monster.damaged':
                this.handleMonsterDamaged(event.data);
                break;
            case 'monster.killed':
                this.handleMonsterKilled(event.data);
                break;
            case 'item.used':
            case 'item.equipped':
            case 'item.unequipped':
            case 'item.dropped':
                this.addMessage(event.data.message);
                break;
            case 'shop.buy':
            case 'shop.sell':
                this.addMessage(event.data.message);
                break;
        }
    }
    
    // 处理角色移动事件
    handleCharacterMove(data) {
        if (data.character_id !== this.character.id) {
            const playerElement = document.querySelector(`.other-player[data-player-id="${data.character_id}"]`);
            if (playerElement) {
                playerElement.style.left = `${data.x}px`;
                playerElement.style.top = `${data.y}px`;
            }
        }
    }
    
    // 处理角色进入事件
    handleCharacterEnter(data) {
        if (data.character_id !== this.character.id) {
            this.otherPlayers.push(data);
            this.updateOtherPlayers();
            this.addMessage(`${data.name}进入了地图`);
        }
    }
    
    // 处理角色离开事件
    handleCharacterLeave(data) {
        if (data.character_id !== this.character.id) {
            this.otherPlayers = this.otherPlayers.filter(p => p.id !== data.character_id);
            this.updateOtherPlayers();
            this.addMessage(`${data.name}离开了地图`);
        }
    }
    
    // 处理怪物受伤事件
    handleMonsterDamaged(data) {
        const monster = this.monsters.find(m => m.id === data.monster_id);
        if (monster) {
            monster.current_hp = data.current_hp;
            if (data.attacker_id !== this.character.id) {
                this.addMessage(`${data.attacker_name}对${data.monster_name}造成${data.damage}点伤害`);
            }
        }
    }
    
    // 处理怪物死亡事件
    handleMonsterKilled(data) {
        const monster = this.monsters.find(m => m.id === data.monster_id);
        if (monster) {
            monster.current_hp = 0;
            if (data.killer_id !== this.character.id) {
                this.addMessage(`${data.killer_name}击杀了${data.monster_name}`);
            }
        }
    }
    
    // 添加游戏消息
    addMessage(message) {
        if (!this.messages) {
            console.warn('消息容器未找到，无法显示消息:', message);
            return;
        }
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        this.messages.appendChild(messageElement);
        this.messages.scrollTop = this.messages.scrollHeight;
    }
}

// 等待DOM加载完成后再创建游戏实例
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    window.game = new Game();
}); 