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
            // 添加游戏控制面板
            this.createGameControls();
            
            // 初始化事件监听
            this.initEventListeners();
        } else {
            console.error('游戏DOM元素未找到，请确保HTML结构正确');
            if (this.messages) {
                this.addMessage('游戏初始化失败，请刷新页面重试', 'error');
            }
        }
    }
    
    // 创建游戏控制面板
    createGameControls() {
        // 检查是否已存在控制面板
        let controlsPanel = document.querySelector('.game-controls');
        if (controlsPanel) {
            controlsPanel.remove();
        }
        
        // 创建控制面板
        controlsPanel = document.createElement('div');
        controlsPanel.className = 'game-controls';
        
        // 添加控制按钮
        const controls = [
            { icon: '❓', title: '游戏帮助', action: 'showHelp' },
            { icon: '🔍', title: '查看地图', action: 'showMapInfo' },
            { icon: '🗺️', title: '地图指南', action: 'showMapGuide' },
            { icon: '💰', title: '商店指南', action: 'showShopGuide' },
            { icon: '⚔️', title: '战斗指南', action: 'showCombatGuide' }
        ];
        
        controls.forEach(control => {
            const btn = document.createElement('div');
            btn.className = 'control-btn';
            btn.innerHTML = control.icon;
            btn.title = control.title;
            btn.dataset.action = control.action;
            btn.addEventListener('click', () => this.handleControlAction(control.action));
            controlsPanel.appendChild(btn);
        });
        
        // 添加到游戏地图容器
        const mapContainer = document.querySelector('.game-map-container');
        if (mapContainer) {
            mapContainer.appendChild(controlsPanel);
        } else {
            this.gameMap.appendChild(controlsPanel);
        }
    }
    
    // 处理控制面板动作
    handleControlAction(action) {
        switch(action) {
            case 'showHelp':
                this.showGameHelp();
                break;
            case 'showMapInfo':
                this.showMapInfo();
                break;
            case 'showMapGuide':
                this.showMapGuide();
                break;
            case 'showShopGuide':
                this.showShopGuide();
                break;
            case 'showCombatGuide':
                this.showCombatGuide();
                break;
        }
    }
    
    // 显示游戏帮助
    showGameHelp() {
        this.addMessage('==== 游戏帮助 ====', 'system');
        this.addMessage('- 点击地图移动角色', 'info');
        this.addMessage('- 点击怪物进行攻击', 'info');
        this.addMessage('- 点击商店进行购物', 'info');
        this.addMessage('- 点击传送点前往其他地图', 'info');
        this.addMessage('- 使用技能栏中的技能', 'info');
    }
    
    // 显示地图信息
    showMapInfo() {
        if (this.currentMap) {
            this.addMessage(`==== 地图信息 ====`, 'system');
            this.addMessage(`地图: ${this.currentMap.name}`, 'info');
            this.addMessage(`描述: ${this.currentMap.description || '无描述'}`, 'info');
            this.addMessage(`当前位置: (${this.character.position_x}, ${this.character.position_y})`, 'info');
            this.addMessage(`怪物数量: ${this.monsters.filter(m => !m.is_dead).length}`, 'info');
            this.addMessage(`商店数量: ${this.shops.length}`, 'info');
        } else {
            this.addMessage('地图数据未加载', 'error');
        }
    }
    
    // 显示地图指南
    showMapGuide() {
        this.addMessage('==== 地图指南 ====', 'system');
        this.addMessage('游戏世界由以下地图组成：', 'info');
        this.addMessage('1. 新手村 - 初始区域，适合新手（等级需求：1级）', 'info');
        this.addMessage('2. 幽暗森林 - 茂密的森林，隐藏着危险生物（等级需求：5级）', 'info');
        this.addMessage('3. 古老矿洞 - 昏暗的地下洞窟，曾是矮人的矿场（等级需求：10级）', 'info');
        this.addMessage('4. 炽热沙漠 - 荒芜的沙漠，隐藏着远古遗迹（等级需求：15级）', 'info');
        this.addMessage('寻找紫色的传送点，点击后可传送到其他地图', 'info');
        
        // 检测当前地图上的传送点
        const currentTelepoints = document.querySelectorAll('.teleport-point');
        if (currentTelepoints.length > 0) {
            this.addMessage(`当前地图上有 ${currentTelepoints.length} 个传送点`, 'success');
            this.addMessage('将鼠标悬停在传送点上可查看目标地图', 'info');
        } else {
            this.addMessage('当前地图上没有传送点', 'warning');
        }
    }
    
    // 显示商店指南
    showShopGuide() {
        this.addMessage('==== 商店指南 ====', 'system');
        this.addMessage('- 点击地图上的商店图标打开商店', 'info');
        this.addMessage('- 每个商店出售不同的物品', 'info');
        this.addMessage('- 金币不足时无法购买物品', 'info');
        this.addMessage('- 使用物品可以恢复生命值或魔法值', 'info');
        this.addMessage('- 装备物品可以提升属性', 'info');
        this.addMessage(`您当前的金币: ${this.character.gold || 0}`, 'gold');
    }
    
    // 显示战斗指南
    showCombatGuide() {
        this.addMessage('==== 战斗指南 ====', 'system');
        this.addMessage('- 点击怪物开始战斗', 'info');
        this.addMessage('- 普通攻击不消耗魔法值', 'info');
        this.addMessage('- 使用技能可以造成更高伤害', 'info');
        this.addMessage('- 击败怪物获得经验和金币', 'info');
        this.addMessage('- 获得足够经验可以升级', 'info');
        this.addMessage(`您当前的攻击力: ${this.character.attack}`, 'combat');
        this.addMessage(`您当前的防御力: ${this.character.defense}`, 'combat');
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
                    // 过滤出有效的玩家数据
                    this.otherPlayers = players.filter(player => 
                        player && player.id && player.name && 
                        player.position_x !== undefined && 
                        player.position_y !== undefined
                    );
                    console.log('当前地图上的其他玩家:', this.otherPlayers);
                    this.updateOtherPlayers();
                })
                .joining((player) => {
                    // 验证玩家数据完整性
                    if (player && player.id && player.name && 
                        player.position_x !== undefined && 
                        player.position_y !== undefined) {
                        this.otherPlayers.push(player);
                        this.updateOtherPlayers();
                        this.addMessage(`${player.name} 进入了地图`);
                    } else {
                        console.warn('接收到不完整的joining玩家数据:', player);
                    }
                })
                .leaving((player) => {
                    // 即使数据不完整，也尝试按ID移除
                    if (player && player.id) {
                        this.otherPlayers = this.otherPlayers.filter(p => p.id !== player.id);
                        this.updateOtherPlayers();
                        if (player.name) {
                            this.addMessage(`${player.name} 离开了地图`);
                        } else {
                            this.addMessage(`一位玩家离开了地图`);
                        }
                    }
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
                
                // 添加登录按钮
                const loginPrompt = document.getElementById('login-prompt');
                if (loginPrompt) {
                    loginPrompt.style.display = 'block';
                }
                return;
            }
            
            // 配置axios默认请求头
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // 添加响应拦截器，用于处理错误
            axios.interceptors.response.use(
                response => response, // 直接返回成功的响应
                error => {
                    // 处理错误响应
                    console.error('请求失败:', error);
                    
                    // 处理和显示详细的错误信息
                    if (error.response && error.response.data) {
                        console.error('错误响应数据:', error.response.data);
                        
                        // 确保错误对象包含完整的响应信息
                        error.responseData = error.response.data;
                    }
                    
                    // 继续抛出错误，让调用者处理
                    return Promise.reject(error);
                }
            );
            
            // 获取角色数据
            const characterResponse = await axios.get('/api/character');
            this.character = characterResponse.data.character;
            // 将gold值添加到角色对象中
            this.character.gold = characterResponse.data.gold || 0;
            console.log('获取到角色数据:', this.character);
            
            // 更新角色信息显示
            this.updateCharacterInfo();
            
            // 获取当前地图数据
            await this.loadMapData();
            
            // 获取技能数据
            const skillsResponse = await axios.get('/api/skills');
            console.log('获取到技能数据:', skillsResponse.data);
            this.updateSkillsList(skillsResponse.data.skills);
            
            // 获取背包数据
            const inventoryResponse = await axios.get('/api/inventory');
            console.log('获取到背包数据:', inventoryResponse.data);
            this.updateInventoryList(inventoryResponse.data.inventory);
            
            // 初始化WebSocket连接
            this.initWebSocket();
            
            // 游戏初始化完成
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            this.addMessage('游戏加载完成', 'success');
        } catch (error) {
            console.error('加载游戏数据失败:', error);
            if (error.response) {
                console.error('错误状态码:', error.response.status);
                console.error('错误数据:', error.response.data);
            }
            this.addMessage('加载游戏数据失败，请刷新页面重试', 'error');
            
            // 显示错误信息
            const errorMessage = error.response && error.response.data.message 
                ? error.response.data.message 
                : error.message;
            this.addMessage(`错误信息: ${errorMessage}`, 'error');
            
            // 添加登录按钮
            const loginPrompt = document.getElementById('login-prompt');
            if (loginPrompt) {
                loginPrompt.style.display = 'block';
            }
        }
    }
    
    // 加载地图数据
    async loadMapData() {
        try {
            if (!this.character || !this.character.current_map_id) {
                console.error('角色数据不完整，无法加载地图');
                return;
            }
            
            // 显示加载状态
            this.addMessage(`正在加载地图数据...`, 'system');
            
            // 获取地图数据
            const mapResponse = await axios.get(`/api/map/${this.character.current_map_id}`);
            console.log('获取到地图数据:', mapResponse.data);
            
            this.currentMap = mapResponse.data.map;
            this.monsters = mapResponse.data.monsters;
            this.otherPlayers = mapResponse.data.otherPlayers;
            
            // 检查角色等级是否满足地图要求
            if (this.character.level < this.currentMap.level_required) {
                this.addMessage(`警告: 当前地图需要${this.currentMap.level_required}级，您可能面临更大危险！`, 'warning');
            }
            
            // 获取商店数据
            try {
                const shopsResponse = await axios.get(`/api/shops/map/${this.character.current_map_id}`);
                console.log('获取到商店数据:', shopsResponse.data);
                this.shops = shopsResponse.data.shops;
            } catch (error) {
                console.error('获取商店信息失败:', error);
                this.addMessage('获取商店信息失败', 'error');
            }
            
            // 更新地图显示
            this.updateMap();
            
            // 添加地图信息消息
            this.addMessage(`进入地图：${this.currentMap.name}`, 'info');
            this.addMessage(`描述：${this.currentMap.description}`, 'info');
            this.addMessage(`等级需求：${this.currentMap.level_required}级`, 'info');
            
            // 重新初始化WebSocket连接（如果地图改变）
            this.initWebSocket();
            
            return true;
        } catch (error) {
            console.error('加载地图数据失败:', error);
            if (error.response) {
                console.error('错误状态码:', error.response.status);
                console.error('错误数据:', error.response.data);
            }
            this.addMessage('加载地图数据失败', 'error');
            return false;
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
        
        // 更新地图背景
        if (this.currentMap.background_image) {
            this.gameMap.style.backgroundImage = `url('/images/${this.currentMap.background_image}')`;
        }
        
        // 更新角色位置
        this.updatePlayerPosition();
        
        // 更新怪物
        this.updateMonsters();
        
        // 更新其他玩家
        this.updateOtherPlayers();
        
        // 更新商店
        this.updateShops();
        
        // 更新传送点
        this.updateTeleportPoints();
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
        
        console.log('更新怪物显示，当前怪物列表:', this.monsters);
        
        // 清除现有怪物
        document.querySelectorAll('.monster').forEach(monster => monster.remove());
        
        // 添加怪物（只显示未死亡的怪物）
        this.monsters.filter(monster => !monster.is_dead).forEach(monster => {
            console.log('添加怪物到地图:', monster);
            const monsterElement = document.createElement('div');
            monsterElement.className = 'monster';
            monsterElement.dataset.monsterId = monster.id;
            monsterElement.style.left = `${monster.position_x}px`;
            monsterElement.style.top = `${monster.position_y}px`;
            monsterElement.innerHTML = monster.name;
            
            // 添加提示信息
            monsterElement.title = `${monster.name} Lv.${monster.level || '?'} (点击攻击)`;
            
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
            // 检查玩家数据是否完整
            if (player.id && player.name && player.position_x !== undefined && 
                player.position_y !== undefined && player.id !== this.character.id) {
                
                const playerElement = document.createElement('div');
                playerElement.className = 'player other-player';
                playerElement.dataset.playerId = player.id;
                playerElement.style.left = `${player.position_x}px`;
                playerElement.style.top = `${player.position_y}px`;
                playerElement.innerHTML = player.name;
                this.gameMap.appendChild(playerElement);
            } else {
                console.warn('接收到不完整的玩家数据:', player);
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
            
            // 添加提示信息
            shopElement.title = `${shop.name} (点击购物)`;
            
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
    
    // 更新传送点显示
    updateTeleportPoints() {
        if (!this.gameMap || !this.currentMap || !this.currentMap.teleport_points) {
            console.warn('无法更新传送点: gameMap或currentMap为空，或传送点数据不存在');
            // 添加调试信息
            if (this.currentMap) {
                console.log('当前地图数据:', {
                    id: this.currentMap.id,
                    name: this.currentMap.name,
                    teleport_points: this.currentMap.teleport_points
                });
            }
            return;
        }
        
        // 清除现有传送点和地图标签
        document.querySelectorAll('.teleport-point, .map-label').forEach(element => element.remove());
        
        // 添加传送点
        if (Array.isArray(this.currentMap.teleport_points)) {
            console.log(`正在添加${this.currentMap.teleport_points.length}个传送点`);
            
            this.currentMap.teleport_points.forEach(point => {
                const teleportElement = document.createElement('div');
                teleportElement.className = 'teleport-point';
                teleportElement.style.left = `${point.x}px`; // 修复：添加左侧定位
                teleportElement.style.top = `${point.y}px`;
                teleportElement.innerHTML = '传送';
                teleportElement.dataset.targetMapId = point.target_map_id;
                teleportElement.dataset.targetX = point.target_x;
                teleportElement.dataset.targetY = point.target_y;
                
                // 获取目标地图名称（如果可用）
                let targetMapName = '未知地图';
                if (point.target_map_id === 1) targetMapName = '新手村';
                else if (point.target_map_id === 2) targetMapName = '幽暗森林';
                else if (point.target_map_id === 3) targetMapName = '古老矿洞';
                else if (point.target_map_id === 4) targetMapName = '炽热沙漠';
                
                // 添加点击事件
                teleportElement.addEventListener('click', () => {
                    this.showTeleportConfirm(point.target_map_id, point.target_x, point.target_y, targetMapName);
                });
                
                // 添加提示信息
                teleportElement.title = `传送到${targetMapName}`;
                
                this.gameMap.appendChild(teleportElement);
                console.log(`已添加传送点: ${point.x}, ${point.y} -> 地图${point.target_map_id}(${targetMapName})`);
                
                // 添加地图标签
                const mapLabel = document.createElement('div');
                mapLabel.className = 'map-label';
                mapLabel.textContent = targetMapName;
                mapLabel.style.left = `${point.x}px`;
                mapLabel.style.top = `${point.y - 10}px`;
                this.gameMap.appendChild(mapLabel);
            });
            
            // 添加调试消息
            this.addMessage(`此地图上有${this.currentMap.teleport_points.length}个传送点`, 'info');
        } else {
            console.warn('传送点数据不是数组:', this.currentMap.teleport_points);
            this.addMessage('此地图上没有传送点数据', 'warning');
        }
        
        // 添加当前地图名称指示器
        if (!document.querySelector('.map-indicator')) {
            const mapIndicator = document.createElement('div');
            mapIndicator.className = 'map-indicator';
            mapIndicator.textContent = `当前地图: ${this.currentMap.name}`;
            this.gameMap.appendChild(mapIndicator);
        }
    }
    
    // 显示传送确认
    showTeleportConfirm(targetMapId, targetX, targetY, targetMapName) {
        // 不直接创建额外的确认对话框，而是直接显示一条消息，然后传送
        this.addMessage(`准备传送到${targetMapName}，等待确认...`, 'system');
        
        // 创建一个过渡动画元素
        let transitionEl = document.querySelector('.map-transition');
        if (!transitionEl) {
            transitionEl = document.createElement('div');
            transitionEl.className = 'map-transition';
            document.body.appendChild(transitionEl);
        }
        
        // 激活过渡动画
        setTimeout(() => { 
            transitionEl.classList.add('active');
            
            // 执行传送
            setTimeout(async () => {
                await this.teleportToMap(targetMapId, targetX, targetY);
                
                // 延迟后关闭过渡动画
                setTimeout(() => {
                    transitionEl.classList.remove('active');
                }, 500);
            }, 500);
        }, 100);
    }
    
    // 传送到其他地图
    async teleportToMap(targetMapId, targetX, targetY) {
        try {
            console.log(`尝试传送到地图: ${targetMapId}, 位置: (${targetX}, ${targetY})`);
            
            this.addMessage(`正在传送到新地图...`, 'system');
            
            // 显示传送动画
            this.showTeleportingEffect();
            
            // 传送请求
            const response = await axios.post('/api/map/change', { 
                map_id: targetMapId,
                target_x: targetX,
                target_y: targetY
            });
            
            // 更新角色信息和地图
            this.character = response.data.character;
            this.currentMap = response.data.map;
            
            // 重新加载地图数据
            await this.loadMapData();
            
            // 更新地图显示
            this.updateMap();
            
            // 显示传送成功消息
            this.addMessage(`成功传送到${this.currentMap.name}`, 'success');
            this.addMessage(`当前地图等级需求: ${this.currentMap.level_required}级`, 'info');
            
            // 如果角色等级低于地图要求，显示警告
            if (this.character.level < this.currentMap.level_required) {
                this.addMessage(`警告: 您的等级低于地图要求，将面临更大危险！`, 'warning');
            }
            
            // 播放传送完成动画
            this.showTeleportCompleteEffect();
        } catch (error) {
            console.error('传送失败:', error);
            if (error.response) {
                console.error('错误状态码:', error.response.status);
                console.error('错误数据:', error.response.data);
                
                // 检查是否因等级问题无法传送
                if (error.response.data && error.response.data.message) {
                    this.addMessage(`传送失败: ${error.response.data.message}`, 'error');
                    return;
                }
            }
            this.addMessage('传送失败，请重试', 'error');
        }
    }
    
    // 显示传送中动画效果
    showTeleportingEffect() {
        const player = document.getElementById('player');
        if (player) {
            player.classList.add('teleporting');
            
            // 2秒后移除动画效果
            setTimeout(() => {
                player.classList.remove('teleporting');
            }, 2000);
        }
    }
    
    // 显示传送完成效果
    showTeleportCompleteEffect() {
        const player = document.getElementById('player');
        if (player) {
            player.classList.add('teleport-complete');
            
            // 1秒后移除动画效果
            setTimeout(() => {
                player.classList.remove('teleport-complete');
            }, 1000);
        }
    }
    
    // 移动角色
    async moveCharacter(x, y) {
        try {
            console.log(`尝试移动角色到位置: (${x}, ${y})`);
            
            // 首先检查是否在传送点上
            const teleportPoint = this.checkTeleportPoint(x, y);
            if (teleportPoint) {
                // 获取目标地图名称
                let targetMapName = '未知地图';
                if (teleportPoint.target_map_id === 1) targetMapName = '新手村';
                else if (teleportPoint.target_map_id === 2) targetMapName = '幽暗森林';
                else if (teleportPoint.target_map_id === 3) targetMapName = '古老矿洞';
                else if (teleportPoint.target_map_id === 4) targetMapName = '炽热沙漠';
                
                // 如果在传送点上，则显示传送确认
                this.showTeleportConfirm(
                    teleportPoint.target_map_id, 
                    teleportPoint.target_x, 
                    teleportPoint.target_y,
                    targetMapName
                );
                return;
            }
            
            // 正常移动
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
                
                // 如果是等级不够的错误
                if (error.response.data && error.response.data.message && 
                    error.response.data.message.includes('等级不够')) {
                    this.addMessage(error.response.data.message, 'error');
                    return;
                }
            }
            this.addMessage('移动失败', 'error');
        }
    }
    
    // 检查是否在传送点上
    checkTeleportPoint(x, y) {
        if (!this.currentMap || !this.currentMap.teleport_points) {
            return null;
        }
        
        // 检测距离，如果在传送点30px范围内就触发传送
        const teleportRange = 30;
        const teleportPoint = Array.isArray(this.currentMap.teleport_points) ? 
            this.currentMap.teleport_points.find(point => {
                const distance = Math.sqrt(
                    Math.pow(point.x - x, 2) + 
                    Math.pow(point.y - y, 2)
                );
                return distance <= teleportRange;
            }) : null;
            
        return teleportPoint;
    }
    
    // 显示怪物模态框
    async showMonsterModal(monsterId) {
        const monster = this.monsters.find(m => m.id === parseInt(monsterId));
        if (!monster) return;
        
        const monsterNameEl = document.getElementById('monster-name');
        const monsterDetailsEl = document.getElementById('monster-details');
        const monsterModal = document.getElementById('monster-modal');
        
        if (!monsterNameEl || !monsterDetailsEl || !monsterModal) {
            console.error('怪物模态框元素未找到');
            return;
        }
        
        monsterNameEl.textContent = monster.name;
        monsterDetailsEl.innerHTML = `
            <p>等级：${monster.level}</p>
            <p>生命：<span class="monster-hp">${monster.current_hp}/${monster.hp}</span></p>
            <div class="hp-bar-container">
                <div class="monster-hp-bar" style="width: ${monster.hp_percentage || (monster.current_hp / monster.hp * 100)}%;"></div>
            </div>
            <p>攻击：${monster.attack}</p>
            <p>防御：${monster.defense}</p>
        `;
        
        monsterModal.style.display = 'block';
        monsterModal.dataset.monsterId = monsterId;
    }
    
    // 显示商店模态框
    async showShopModal(shopId) {
        try {
            const response = await axios.get(`/api/shop/${shopId}`);
            const shop = response.data.shop;
            const shopItems = response.data.shop_items;
            
            const shopNameEl = document.getElementById('shop-name');
            const shopItemsEl = document.getElementById('shop-items');
            const shopModal = document.getElementById('shop-modal');
            
            if (!shopNameEl || !shopItemsEl || !shopModal) {
                console.error('商店模态框元素未找到');
                return;
            }
            
            // 显示商店名称和玩家当前金币
            shopNameEl.innerHTML = `${shop.name} <span class="player-gold">您的金币: ${this.character.gold || 0}</span>`;
            
            shopItemsEl.innerHTML = shopItems.map(item => {
                // 检查玩家是否有足够的金币购买该物品
                const canAfford = (this.character.gold || 0) >= item.price;
                const affordClass = canAfford ? 'can-afford' : 'cannot-afford';
                const buyButton = canAfford ? 
                    `<button class="btn buy-btn" onclick="game.buyItem(${item.id})">购买</button>` : 
                    `<button class="btn buy-btn disabled" title="金币不足">购买</button>`;
                
                return `
                <div class="item ${affordClass}" data-shop-item-id="${item.id}">
                    <div class="item-icon">${item.item.image || '物'}</div>
                    <div class="item-info">
                        <div>${item.item.name}</div>
                        <div class="price-info">价格：${item.price}金币 ${!canAfford ? '<span class="not-enough">(金币不足)</span>' : ''}</div>
                        <div class="item-description">${item.item.description || ''}</div>
                    </div>
                    ${buyButton}
                </div>
                `;
            }).join('');
            
            shopModal.style.display = 'block';
            
            // 添加购买提示信息
            this.addMessage(`您正在浏览${shop.name}，您有${this.character.gold || 0}金币可用于购买`);
        } catch (error) {
            console.error('获取商店信息失败:', error);
            this.addMessage('获取商店信息失败');
        }
    }
    
    // 显示物品模态框
    showItemModal(itemId) {
        const inventoryItem = this.inventory.find(i => i.id === parseInt(itemId));
        if (!inventoryItem) return;
        
        const itemNameEl = document.getElementById('item-name');
        const itemDetailsEl = document.getElementById('item-details');
        const itemActionsEl = document.getElementById('item-actions');
        const itemModal = document.getElementById('item-modal');
        
        if (!itemNameEl || !itemDetailsEl || !itemActionsEl || !itemModal) {
            console.error('物品模态框元素未找到');
            return;
        }
        
        itemNameEl.textContent = inventoryItem.item.name;
        itemDetailsEl.innerHTML = `
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
        
        itemActionsEl.innerHTML = actions.join('');
        itemModal.style.display = 'block';
    }
    
    // 显示技能选择模态框
    showSkillSelectModal() {
        const monsterModal = document.getElementById('monster-modal');
        const skillSelectListEl = document.getElementById('skill-select-list');
        const skillSelectModal = document.getElementById('skill-select-modal');
        
        if (!monsterModal || !skillSelectListEl || !skillSelectModal) {
            console.error('技能选择模态框元素未找到');
            return;
        }
        
        const monsterId = monsterModal.dataset.monsterId;
        
        skillSelectListEl.innerHTML = this.skills.map(skill => `
            <div class="skill" onclick="game.useSkill(${skill.id}, ${monsterId})">
                <div class="skill-icon">${skill.skill.icon || '技'}</div>
                <div class="skill-info">
                    <div>${skill.skill.name} Lv.${skill.level}</div>
                    <div>MP消耗：${skill.skill.mp_cost}</div>
                </div>
            </div>
        `).join('');
        
        skillSelectModal.style.display = 'block';
    }
    
    // 攻击怪物
    async attackMonster() {
        const monsterId = document.getElementById('monster-modal').dataset.monsterId;
        try {
            console.log('开始攻击怪物，ID:', monsterId);
            
            // 发送测试请求记录数据
            await axios.post('/api/test/log', { 
                action: 'attack_monster',
                monster_id: monsterId,
                timestamp: new Date().toISOString()
            });
            
            const response = await axios.post('/api/monster/attack', { monster_id: monsterId });
            console.log('攻击怪物响应:', response.data);
            
            // 更新怪物信息
            if (response.data.monster) {
                const monster = this.monsters.find(m => m.id === parseInt(monsterId));
                if (monster) {
                    console.log('更新前怪物数据:', { ...monster });
                    monster.current_hp = response.data.monster.current_hp;
                    monster.hp_percentage = (response.data.monster.current_hp / response.data.monster.hp) * 100;
                    
                    // 检查怪物是否已死亡
                    if (response.data.monster_killed) {
                        monster.is_dead = true;
                    }
                    
                    console.log('更新后怪物数据:', { ...monster });
                    
                    // 更新怪物模态窗口中的血量显示
                    const monsterModal = document.getElementById('monster-modal');
                    if (monsterModal && monsterModal.style.display === 'block') {
                        const monsterHpElement = monsterModal.querySelector('.monster-hp');
                        if (monsterHpElement) {
                            console.log('更新怪物血量文本:', `${response.data.monster.current_hp}/${response.data.monster.hp}`);
                            monsterHpElement.textContent = `${response.data.monster.current_hp}/${response.data.monster.hp}`;
                        } else {
                            console.error('未找到怪物血量元素');
                        }
                        
                        const monsterHpBar = monsterModal.querySelector('.monster-hp-bar');
                        if (monsterHpBar) {
                            console.log('更新怪物血量条宽度:', `${monster.hp_percentage}%`);
                            monsterHpBar.style.width = `${monster.hp_percentage}%`;
                        } else {
                            console.error('未找到怪物血量条元素');
                        }
                    }
                }
            }
            
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
            
            const skillSelectModal = document.getElementById('skill-select-modal');
            if (skillSelectModal) {
                skillSelectModal.style.display = 'none';
            }
        } catch (error) {
            console.error('使用技能失败:', error);
            this.addMessage('使用技能失败');
        }
    }
    
    // 购买物品
    async buyItem(shopItemId) {
        try {
            console.log(`尝试购买商品，ID: ${shopItemId}`);
            
            // 获取商品信息
            const shopItem = document.querySelector(`.item[data-shop-item-id="${shopItemId}"]`);
            if (shopItem && shopItem.classList.contains('cannot-afford')) {
                this.addMessage('您的金币不足，无法购买此物品', 'error');
                return;
            }
            
            const response = await axios.post('/api/shop/buy', {
                shop_item_id: shopItemId,
                quantity: 1
            });
            console.log('购买成功，响应:', response.data);
            this.character = response.data.character;
            this.updateCharacterInfo();
            this.updateInventoryList(response.data.inventory);
            
            // 更新商店中显示的金币数量
            const shopNameEl = document.getElementById('shop-name');
            if (shopNameEl) {
                const goldSpan = shopNameEl.querySelector('.player-gold');
                if (goldSpan) {
                    goldSpan.textContent = `您的金币: ${this.character.gold || 0}`;
                }
            }
            
            // 更新商店物品的可购买状态
            this.updateShopItemsAffordability();
            
            // 显示成功消息
            this.addMessage(response.data.message, 'success');
        } catch (error) {
            console.error('购买失败:', error);
            
            // 首先检查我们在拦截器中添加的responseData
            if (error.responseData && error.responseData.message) {
                console.log('从responseData中提取错误消息:', error.responseData.message);
                this.addMessage('购买失败: ' + error.responseData.message, 'error');
                return;
            }
            
            // 如果没有responseData，则检查标准的response
            if (error.response && error.response.data) {
                console.error('错误状态码:', error.response.status);
                console.error('错误数据:', error.response.data);
                
                if (error.response.data.message) {
                    console.log('从response.data中提取错误消息:', error.response.data.message);
                    this.addMessage('购买失败: ' + error.response.data.message, 'error');
                    return;
                }
            }
            
            // 如果没有找到具体的错误消息，显示通用提示
            this.addMessage('购买失败，请重试', 'error');
        }
    }
    
    // 更新商店物品的可购买状态
    updateShopItemsAffordability() {
        const shopItems = document.querySelectorAll('#shop-items .item');
        shopItems.forEach(item => {
            const priceText = item.querySelector('.price-info');
            if (priceText) {
                const priceMatch = priceText.textContent.match(/价格：(\d+)金币/);
                if (priceMatch && priceMatch[1]) {
                    const price = parseInt(priceMatch[1]);
                    const canAfford = (this.character.gold || 0) >= price;
                    
                    // 更新样式类
                    if (canAfford) {
                        item.classList.remove('cannot-afford');
                        item.classList.add('can-afford');
                        
                        // 更新价格显示
                        const notEnoughSpan = priceText.querySelector('.not-enough');
                        if (notEnoughSpan) {
                            notEnoughSpan.remove();
                        }
                        
                        // 更新按钮
                        const buyBtn = item.querySelector('.buy-btn');
                        if (buyBtn) {
                            buyBtn.classList.remove('disabled');
                            buyBtn.removeAttribute('title');
                            
                            // 确保点击事件可用
                            const itemId = item.dataset.shopItemId;
                            buyBtn.setAttribute('onclick', `game.buyItem(${itemId})`);
                        }
                    } else {
                        item.classList.remove('can-afford');
                        item.classList.add('cannot-afford');
                        
                        // 更新价格显示
                        if (!priceText.querySelector('.not-enough')) {
                            priceText.innerHTML = `价格：${price}金币 <span class="not-enough">(金币不足)</span>`;
                        }
                        
                        // 更新按钮
                        const buyBtn = item.querySelector('.buy-btn');
                        if (buyBtn) {
                            buyBtn.classList.add('disabled');
                            buyBtn.setAttribute('title', '金币不足');
                            buyBtn.removeAttribute('onclick');
                        }
                    }
                }
            }
        });
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
            
            const itemModal = document.getElementById('item-modal');
            if (itemModal) {
                itemModal.style.display = 'none';
            }
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
            
            const itemModal = document.getElementById('item-modal');
            if (itemModal) {
                itemModal.style.display = 'none';
            }
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
            
            const itemModal = document.getElementById('item-modal');
            if (itemModal) {
                itemModal.style.display = 'none';
            }
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
            
            const itemModal = document.getElementById('item-modal');
            if (itemModal) {
                itemModal.style.display = 'none';
            }
        } catch (error) {
            console.error('丢弃物品失败:', error);
            this.addMessage('丢弃物品失败');
        }
    }
    
    // 处理战斗结果
    handleCombatResult(result) {
        if (result.success) {
            console.log('处理战斗结果:', result);
            
            // 更新角色信息
            this.character = result.character;
            this.updateCharacterInfo();
            
            // 构建消息
            let message = `对怪物造成${result.damage}点伤害`;
            let messageType = 'combat';
            
            if (result.monster_killed) {
                message += `，击杀怪物获得${result.exp_gained}经验和${result.gold_gained}金币`;
                
                if (result.leveled_up) {
                    message += `，升级到${result.new_level}级！`;
                    messageType = 'success';  // 升级使用success类型
                }
                
                // 处理怪物死亡
                console.log('怪物被击杀，处理怪物死亡');
                const monsterModal = document.getElementById('monster-modal');
                if (!monsterModal) {
                    console.error('怪物模态框元素未找到');
                    return;
                }
                
                const monsterId = monsterModal.dataset.monsterId;
                
                // 标记怪物为死亡状态
                const monster = this.monsters.find(m => m.id === parseInt(monsterId));
                if (monster) {
                    monster.is_dead = true;
                    console.log('标记怪物为死亡状态:', monster);
                }
                
                // 从地图上移除怪物元素
                const monsterElement = document.querySelector(`.monster[data-monster-id="${monsterId}"]`);
                if (monsterElement) {
                    console.log('从DOM中移除怪物元素');
                    monsterElement.remove();
                } else {
                    console.error('未找到怪物元素，无法从DOM中移除');
                }
                
                // 从怪物列表中移除（改为保留但标记为死亡）
                // this.monsters = this.monsters.filter(m => m.id !== parseInt(monsterId));
                
                // 关闭模态框
                monsterModal.style.display = 'none';
                
                // 更新怪物显示
                this.updateMonsters();
            }
            
            this.addMessage(message, messageType);
            
            // 如果获得金币，单独显示一条消息
            if (result.monster_killed && result.gold_gained > 0) {
                this.addMessage(`您获得了 ${result.gold_gained} 金币`, 'gold');
            }
        } else {
            console.error('战斗失败:', result);
            this.addMessage('战斗失败', 'error');
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
            case 'monster.respawning':
                this.handleMonsterRespawning(event.data);
                break;
            case 'monster.respawned':
                this.handleMonsterRespawned(event.data);
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
        // 确保数据完整，且不是当前玩家
        if (data && data.character_id && data.x !== undefined && data.y !== undefined && 
            data.character_id !== this.character.id) {
            
            const playerElement = document.querySelector(`.other-player[data-player-id="${data.character_id}"]`);
            if (playerElement) {
                playerElement.style.left = `${data.x}px`;
                playerElement.style.top = `${data.y}px`;
                
                // 同时更新otherPlayers数组中的玩家位置
                const playerIndex = this.otherPlayers.findIndex(p => p.id === data.character_id);
                if (playerIndex !== -1) {
                    this.otherPlayers[playerIndex].position_x = data.x;
                    this.otherPlayers[playerIndex].position_y = data.y;
                }
            } else {
                // 玩家元素不存在，可能是新玩家或数据不同步
                console.warn('尝试移动不存在的玩家元素:', data);
            }
        }
    }
    
    // 处理角色进入事件
    handleCharacterEnter(data) {
        if (data.character_id !== this.character.id) {
            // 检查角色数据是否完整
            if (data.character_id && data.name && data.x !== undefined && data.y !== undefined) {
                // 确保数据格式一致
                const playerData = {
                    id: data.character_id,
                    name: data.name,
                    position_x: data.x,
                    position_y: data.y,
                    level: data.level || 1
                };
                
                this.otherPlayers.push(playerData);
                this.updateOtherPlayers();
                this.addMessage(`${data.name}进入了地图`);
            } else {
                console.warn('接收到不完整的角色进入数据:', data);
            }
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
            monster.hp_percentage = data.hp_percentage;
            
            // 更新怪物模态窗口中的血量显示
            const monsterModal = document.getElementById('monster-modal');
            if (monsterModal && monsterModal.style.display === 'block') {
                const monsterHpElement = monsterModal.querySelector('.monster-hp');
                if (monsterHpElement) {
                    monsterHpElement.textContent = `${data.current_hp}/${monster.hp}`;
                }
                
                const monsterHpBar = monsterModal.querySelector('.monster-hp-bar');
                if (monsterHpBar) {
                    monsterHpBar.style.width = `${data.hp_percentage}%`;
                }
            }
            
            if (data.attacker_id !== this.character.id) {
                this.addMessage(`${data.attacker_name}对${data.monster_name}造成${data.damage}点伤害`);
            }
        }
    }
    
    // 处理怪物死亡事件
    handleMonsterKilled(data) {
        console.log('处理怪物死亡事件:', data);
        const monster = this.monsters.find(m => m.id === data.monster_id);
        if (monster) {
            console.log('找到被击杀的怪物:', monster);
            monster.current_hp = 0;
            monster.is_dead = true;
            
            // 从地图上移除怪物元素
            const monsterElement = document.querySelector(`.monster[data-monster-id="${data.monster_id}"]`);
            if (monsterElement) {
                console.log('从DOM中移除怪物元素');
                monsterElement.remove();
            } else {
                console.error('未找到怪物元素，无法从DOM中移除');
            }
            
            // 不从怪物列表中移除，只标记为死亡
            // this.monsters = this.monsters.filter(m => m.id !== data.monster_id);
            
            // 更新怪物显示
            this.updateMonsters();
            
            if (data.killer_id !== this.character.id) {
                this.addMessage(`${data.killer_name}击杀了${data.monster_name}`);
            }
        } else {
            console.error('未找到被击杀的怪物:', data.monster_id);
        }
    }
    
    // 处理怪物即将重生事件
    handleMonsterRespawning(data) {
        console.log('怪物即将重生:', data);
        this.addMessage(`${data.monster_name}将在${data.respawn_time}秒后重生`);
    }
    
    // 处理怪物重生事件
    handleMonsterRespawned(data) {
        console.log('怪物重生:', data);
        
        // 查找怪物是否已存在于列表中
        const existingMonsterIndex = this.monsters.findIndex(m => m.id === data.monster_id);
        
        if (existingMonsterIndex !== -1) {
            // 更新现有怪物数据
            this.monsters[existingMonsterIndex] = {
                ...this.monsters[existingMonsterIndex],
                current_hp: data.current_hp,
                hp: data.hp,
                hp_percentage: data.hp_percentage,
                is_dead: false,
                position_x: data.position_x,
                position_y: data.position_y
            };
        } else {
            // 添加新怪物到列表
            this.monsters.push({
                id: data.monster_id,
                name: data.monster_name,
                current_hp: data.current_hp,
                hp: data.hp,
                hp_percentage: data.hp_percentage,
                is_dead: false,
                position_x: data.position_x,
                position_y: data.position_y
            });
        }
        
        // 更新怪物显示
        this.updateMonsters();
        
        this.addMessage(`${data.monster_name}已重生`);
    }
    
    // 添加游戏消息
    addMessage(message, type = 'info') {
        if (!this.messages) {
            console.warn('消息容器未找到，无法显示消息:', message);
            return;
        }
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.classList.add('game-message', `message-${type}`);
        
        // 为不同类型的消息添加前缀图标
        let prefix = '';
        switch(type) {
            case 'error':
                prefix = '❌ ';
                break;
            case 'success':
                prefix = '✅ ';
                break;
            case 'warning':
                prefix = '⚠️ ';
                break;
            case 'gold':
                prefix = '💰 ';
                break;
            case 'combat':
                prefix = '⚔️ ';
                break;
            case 'system':
                prefix = '🔧 ';
                break;
            case 'info':
            default:
                prefix = 'ℹ️ ';
        }
        
        messageElement.textContent = prefix + message;
        
        // 使消息短暂突出显示
        messageElement.classList.add('highlight');
        setTimeout(() => {
            messageElement.classList.remove('highlight');
        }, 2000);
        
        this.messages.appendChild(messageElement);
        this.messages.scrollTop = this.messages.scrollHeight;
        
        // 如果消息太多，移除旧消息
        const maxMessages = 50;
        while (this.messages.children.length > maxMessages) {
            this.messages.removeChild(this.messages.children[0]);
        }
    }
}

// 等待DOM加载完成后再创建游戏实例
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    window.game = new Game();
}); 