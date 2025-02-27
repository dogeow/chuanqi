class Game {
    constructor() {
        this.character = null;
        this.currentMap = null;
        this.monsters = [];
        this.shops = [];
        this.otherPlayers = [];
        
        // 自动攻击相关变量
        this.isAutoAttacking = false;
        this.currentAttackingMonsterId = null;
        
        // 初始化DOM元素引用
        this.initDomElements();
        
        // 加载游戏数据
        this.loadGameData();
        
        // 初始化技能冷却定时器
        this.skillCooldownInterval = null;
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
        
        // 将控制面板添加到垂直侧边栏而不是地图内
        const sidebar = document.querySelector('.vertical-sidebar');
        if (sidebar) {
            // 创建一个新的section来容纳控制按钮
            const controlsSection = document.createElement('div');
            controlsSection.className = 'section controls-section';
            
            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = '游戏指南';
            controlsSection.appendChild(sectionTitle);
            
            controlsSection.appendChild(controlsPanel);
            
            // 将section添加到侧边栏的顶部
            sidebar.insertBefore(controlsSection, sidebar.firstChild);
        } else {
            // 如果找不到侧边栏，则添加到页面顶部
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                controlsPanel.classList.add('top-controls');
                gameContainer.insertBefore(controlsPanel, gameContainer.firstChild);
            } else {
                // 最后的备选方案，添加到body
                document.body.appendChild(controlsPanel);
            }
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
            this.gameMap.addEventListener('click', (event) => {
                // 如果点击的是怪物、商店或传送点，则不处理移动
                if (event.target.classList.contains('monster') || 
                    event.target.classList.contains('shop') || 
                    event.target.classList.contains('teleport-point')) {
                    return;
                }
                
                // 获取点击位置相对于地图的坐标
                const rect = this.gameMap.getBoundingClientRect();
                const x = Math.round(event.clientX - rect.left);
                const y = Math.round(event.clientY - rect.top);
                
                console.log(`地图点击事件: (${x}, ${y})`);
                
                // 停止自动攻击
                this.stopAutoAttack();
                
                // 移动角色到点击位置
                this.moveCharacter(x, y);
            });
            
            // 怪物点击事件
            this.gameMap.addEventListener('click', (event) => {
                if (event.target.classList.contains('monster')) {
                    const monsterId = event.target.dataset.monsterId;
                    if (monsterId) {
                        // 直接攻击怪物，不再弹出模态窗口
                        this.directAttackMonster(monsterId);
                    }
                }
            });
            
            // 商店点击事件
            this.gameMap.addEventListener('click', (event) => {
                if (event.target.classList.contains('shop')) {
                    const shopId = event.target.dataset.shopId;
                    if (shopId) {
                        this.showShopModal(shopId);
                    }
                }
            });
            
            // 注意：传送点点击事件已在 updateTeleportPoints 方法中为每个传送点单独添加
            // 移除此处的事件监听器，避免重复触发
        }
        
        // 技能点击事件已移除，技能只作展示用途
        
        // 物品点击事件
        if (this.inventoryList) {
            this.inventoryList.addEventListener('click', (event) => {
                const itemElement = event.target.closest('.item');
                if (itemElement) {
                    const itemId = itemElement.dataset.itemId;
                    if (itemId) {
                        this.showItemModal(itemId);
                    }
                }
            });
        }
        
        // 怪物模态窗口按钮事件
        document.getElementById('attack-monster')?.addEventListener('click', () => {
            this.attackMonster();
        });
        
        document.getElementById('auto-attack-btn')?.addEventListener('click', () => {
            this.toggleAutoAttack();
        });
        
        // 关闭模态窗口按钮事件
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
    }
    
    // 初始化WebSocket连接
    initWebSocket() {
        // 检查角色数据和当前地图数据
        if (!this.character) {
            console.warn('WebSocket初始化延迟：角色数据尚未加载');
            return;
        }
        
        if (!this.character.id) {
            console.warn('WebSocket初始化延迟：角色ID不存在');
            return;
        }
        
        const mapId = this.character.current_map_id || this.character.map_id;
        if (!mapId) {
            console.warn('WebSocket初始化延迟：地图ID不存在');
            return;
        }

        console.log('初始化WebSocket连接，角色ID:', this.character.id, '地图ID:', mapId);
        
        // 清除现有连接
        if (this.mapChannel) {
            console.log('离开之前的地图频道:', this.mapChannel.name);
            if (typeof this.mapChannel.unsubscribe === 'function') {
                this.mapChannel.unsubscribe();
            }
            this.mapChannel = null;
        }

        // 添加延迟以确保旧连接完全清除
        setTimeout(() => {
            try {
                // 订阅到地图频道接收实时事件
                this.mapChannel = window.Echo.join(`map.${mapId}`);
                
                if (!this.mapChannel) {
                    console.error('创建地图频道失败');
                    return;
                }
                
                console.log('成功创建地图频道:', `map.${mapId}`);
                
                // 监听广播的游戏事件
                this.mapChannel.listen('.game.event', (eventData) => {
                    console.log('收到原始游戏事件数据:', eventData);
                    // 检查事件数据格式
                    if (eventData && eventData.type) {
                        console.log(`处理游戏事件: ${eventData.type}`, eventData.data);
                        this.handleGameEvent({
                            type: eventData.type,
                            data: eventData.data
                        });
                    } else {
                        console.warn('收到无效的游戏事件数据:', eventData);
                    }
                });

                // 添加额外的事件监听器用于调试
                this.mapChannel.listenToAll((eventName, eventData) => {
                    console.log(`收到地图频道事件: ${eventName}`, eventData);
                });
                
                // 处理玩家加入事件
                this.mapChannel.here((users) => {
                    console.log('当前在线玩家:', users);
                    users.forEach(user => this.handleCharacterEnter({ character: user }));
                });
                
                this.mapChannel.joining((user) => {
                    console.log('玩家加入地图:', user);
                    this.handleCharacterEnter({ character: user });
                });
                
                this.mapChannel.leaving((user) => {
                    console.log('玩家离开地图:', user);
                    // 确保有用户数据
                    if (user && user.id) {
                        this.handleCharacterExit({ character_id: user.id, character: user });
                        this.addMessage(`${user.name || '玩家'} 离开了地图`);
                    }
                });
                
                // 发送当前玩家加入地图的事件
                console.log('准备发送地图进入通知，角色数据:', {
                    id: this.character.id,
                    map_id: mapId,
                    name: this.character.name
                });
                
                axios.post('/api/map/enter', { 
                    map_id: mapId,
                    character_id: this.character.id
                })
                    .then(response => {
                        console.log('发送地图进入通知成功:', response.data);
                    })
                    .catch(error => {
                        console.error('发送地图进入通知失败:', error);
                        if (error.response) {
                            console.error('错误状态码:', error.response.status);
                            console.error('错误数据:', error.response.data);
                            this.addMessage(`地图进入通知失败: ${error.response.data.message}`, 'error');
                        }
                    });
                    
                console.log('WebSocket初始化完成');
            } catch (error) {
                console.error('WebSocket初始化失败:', error);
                this.addMessage('WebSocket连接失败，部分功能可能不可用', 'error');
            }
        }, 500); // 添加500ms延迟
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
            
            // 验证角色数据的完整性
            if (!characterResponse.data.character || !characterResponse.data.character.id) {
                console.error('获取到的角色数据无效:', characterResponse.data);
                this.addMessage('角色数据无效，请重新登录', 'error');
                throw new Error('角色数据无效');
            }
            
            this.character = characterResponse.data.character;
            // 将gold值添加到角色对象中
            this.character.gold = characterResponse.data.gold || 0;
            console.log('获取到角色数据:', this.character);
            
            // 更新角色信息显示
            this.updateCharacterInfo();
            
            // 确保地图数据加载完成后再继续
            try {
                console.log('开始加载地图数据');
                await this.loadMapData();
                console.log('地图数据加载成功，准备初始化WebSocket');
                
                // 确保角色和地图数据都已正确加载
                if (!this.character.id || !this.character.current_map_id) {
                    console.error('角色或地图数据不完整:', this.character);
                    this.addMessage('角色或地图数据不完整，请刷新页面', 'error');
                    return;
                }
                
                // 初始化WebSocket连接（确保地图数据已加载）
                this.initWebSocket();
            } catch (mapError) {
                console.error('地图数据加载失败，WebSocket初始化延迟:', mapError);
                this.addMessage('地图加载失败，部分游戏功能可能不可用', 'warning');
            }
            
            // 获取技能数据
            try {
                const skillsResponse = await axios.get('/api/skills');
                console.log('获取到技能数据:', skillsResponse.data);
                this.updateSkillsList(skillsResponse.data.skills);
            } catch (skillError) {
                console.error('加载技能数据失败:', skillError);
                this.addMessage('技能数据加载失败', 'warning');
            }
            
            // 获取背包数据
            try {
                const inventoryResponse = await axios.get('/api/inventory');
                console.log('获取到背包数据:', inventoryResponse.data);
                this.updateInventoryList(inventoryResponse.data.inventory);
            } catch (inventoryError) {
                console.error('加载背包数据失败:', inventoryError);
                this.addMessage('背包数据加载失败', 'warning');
            }
            
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
                
                // 如果是未授权错误，则可能是token过期
                if (error.response.status === 401) {
                    console.error('认证失败，令牌可能已过期');
                    localStorage.removeItem('game_token');
                    this.addMessage('登录已过期，请重新登录', 'error');
                    window.location.href = '/login';
                    return;
                }
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
    loadMapData() {
        if (!this.character) {
            console.warn('加载地图数据失败：角色数据不存在');
            return Promise.reject(new Error('角色数据不存在'));
        }
        
        const currentMapId = this.character.current_map_id || this.character.map_id;
        if (!currentMapId) {
            console.warn('加载地图数据失败：地图ID不存在');
            return Promise.reject(new Error('地图ID不存在'));
        }
        
        const oldMapId = this.currentMap ? this.currentMap.id : null;
        console.log(`开始加载地图数据，从地图 #${oldMapId} 到 #${currentMapId}`);
        
        return axios.get(`/api/map/${currentMapId}`)
            .then(response => {
                const data = response.data;
                
                if (data.success !== false) {
                    // 更新地图数据
                    this.currentMap = data.map;
                    
                    // 更新怪物列表
                    this.monsters = data.monsters || [];
                    
                    // 更新商店列表
                    this.shops = data.shops || [];
                    
                    // 更新其他玩家列表
                    this.otherPlayers = data.other_players || [];
                    
                    // 更新地图显示（这会调用 updateMonsters、updateShops、updateTeleportPoints 和 updateOtherPlayers）
                    this.updateMap();
                    
                    // 移除重复调用
                    // this.updateMonsters();
                    // this.updateShops();
                    // this.updateTeleportPoints();
                    // this.updateOtherPlayers();
                    
                    // 检查地图ID是否改变
                    const newMapId = this.character.current_map_id || this.character.map_id;
                    if (newMapId !== oldMapId) {
                        console.log(`地图已从 #${oldMapId} 变更为 #${newMapId}`);
                        
                        // 显示进入新地图的消息
                        this.addMessage(`进入 ${this.currentMap.name}`);
                        
                        // 更新地图指示器
                        const mapIndicator = document.getElementById('map-indicator');
                        if (mapIndicator) {
                            mapIndicator.textContent = this.currentMap.name;
                        }
                    }
                    
                    // 完成加载
                    console.log('地图数据加载完成');
                    return data;
                } else {
                    console.error('获取地图数据失败:', data);
                    this.addMessage('无法加载地图数据，请重试');
                    return Promise.reject(new Error('地图数据无效'));
                }
            })
            .catch(error => {
                console.error('加载地图数据异常:', error);
                this.addMessage('加载地图失败，请检查网络连接');
                return Promise.reject(error);
            });
    }
    
    // 更新角色信息显示
    updateCharacterInfo() {
        if (!this.characterInfo || !this.character) {
            console.error('角色信息容器或数据未找到，无法更新角色信息');
            return;
        }
        
        // 计算升级所需经验
        const expToLevel = this.character.exp_to_level || (this.character.level * 100);
        
        // 确保经验值不为负数
        const currentExp = this.character.exp < 0 ? 0 : this.character.exp;
        
        this.characterInfo.innerHTML = `
            <p>名称：${this.character.name}</p>
            <p>等级：${this.character.level}</p>
            <p>经验：${currentExp}/${expToLevel}</p>
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
    
    // 更新玩家位置显示
    updatePlayerPosition() {
        if (!this.character || !this.gameMap) {
            console.error('无法更新玩家位置：角色数据或地图容器不存在');
            return;
        }
        
        // 获取玩家元素
        let playerElement = document.querySelector('.player:not(.other-player)');
        
        // 如果玩家元素不存在，则创建一个
        if (!playerElement) {
            playerElement = document.createElement('div');
            playerElement.className = 'player';
            this.gameMap.appendChild(playerElement);
            console.log('创建了新的玩家元素');
        }
        
        // 设置玩家位置 - 确保使用正确的坐标
        playerElement.style.left = `${this.character.position_x}px`;
        playerElement.style.top = `${this.character.position_y}px`;
        
        // 创建名字和等级的容器
        const nameContainer = document.createElement('div');
        nameContainer.className = 'player-name-container';
        
        // 设置玩家名称
        const nameElement = document.createElement('div');
        nameElement.className = 'player-name';
        nameElement.textContent = this.character.name;
        
        // 设置玩家等级
        const levelElement = document.createElement('div');
        levelElement.className = 'player-level';
        levelElement.textContent = `Lv.${this.character.level}`;
        
        // 清空玩家元素内容
        playerElement.innerHTML = '';
        
        // 添加名字和等级到容器
        nameContainer.appendChild(levelElement);
        nameContainer.appendChild(nameElement);
       
        // 添加容器到玩家元素
        playerElement.appendChild(nameContainer);
        
        // 添加角色图标（logo）
        const logoElement = document.createElement('div');
        logoElement.className = 'player-logo';
        playerElement.appendChild(logoElement);
        
        console.log(`更新玩家位置: (${this.character.position_x}, ${this.character.position_y}), CSS位置: left=${playerElement.style.left}, top=${playerElement.style.top}`);
    }
    
    // 更新怪物显示
    updateMonsters() {
        if (!this.gameMap || !this.monsters) {
            console.error('地图容器或怪物数据未找到，无法更新怪物');
            return;
        }
        
        console.log(`更新怪物显示，当前怪物列表: ${this.monsters.length}个怪物`);
        
        // 清除现有怪物
        document.querySelectorAll('.monster').forEach(monster => monster.remove());
        
        // 添加怪物（只显示未死亡的怪物）
        const liveMonsters = this.monsters.filter(monster => !monster.is_dead);
        console.log(`添加${liveMonsters.length}个活着的怪物到地图`);
        
        liveMonsters.forEach(monster => {
            // 创建怪物元素
            const monsterElement = document.createElement('div');
            monsterElement.className = 'monster';
            monsterElement.dataset.monsterId = monster.id;
            monsterElement.style.left = `${monster.position_x}px`;
            monsterElement.style.top = `${monster.position_y}px`;
            
            // 创建怪物名称元素
            const nameElement = document.createElement('div');
            nameElement.className = 'monster-name';
            nameElement.textContent = monster.name;
            
            // 创建血条容器
            const hpBarContainer = document.createElement('div');
            hpBarContainer.className = 'monster-hp-bar-container';
            
            // 创建血条
            const hpBar = document.createElement('div');
            hpBar.className = 'monster-hp-bar';
            hpBar.style.width = `${monster.hp_percentage}%`;
            
            // 添加血量文本
            const hpText = document.createElement('div');
            hpText.className = 'monster-hp-text';
            hpText.textContent = `${monster.current_hp}/${monster.hp}`;
            
            // 组装元素
            hpBarContainer.appendChild(hpBar);
            monsterElement.appendChild(nameElement);
            monsterElement.appendChild(hpBarContainer);
            monsterElement.appendChild(hpText);
            
            // 添加提示信息
            monsterElement.title = `${monster.name} Lv.${monster.level || '?'} (点击攻击)`;
            
            this.gameMap.appendChild(monsterElement);
        });
    }
    
    // 更新其他玩家显示
    updateOtherPlayers() {
        // 清除现有的其他玩家元素
        const existingPlayers = document.querySelectorAll('.other-player');
        existingPlayers.forEach(player => player.remove());
        
        // 如果没有地图容器，则退出
        if (!this.gameMap) {
            console.error('找不到地图容器，无法更新其他玩家');
            return;
        }
        
        // 添加其他玩家到地图
        this.otherPlayers.forEach(player => {
            // 创建玩家元素
            const playerElement = document.createElement('div');
            playerElement.className = 'player other-player';
            playerElement.dataset.playerId = player.id;
            
            // 创建名字和等级的容器
            const nameContainer = document.createElement('div');
            nameContainer.className = 'player-name-container';
            
            // 设置玩家名称
            const nameElement = document.createElement('div');
            nameElement.className = 'player-name';
            nameElement.textContent = player.name;
            
            // 设置玩家等级
            const levelElement = document.createElement('div');
            levelElement.className = 'player-level';
            levelElement.textContent = `Lv.${player.level || 1}`;
            
            // 添加名字和等级到容器
            nameContainer.appendChild(nameElement);
            nameContainer.appendChild(levelElement);
            
            // 添加容器到玩家元素
            playerElement.appendChild(nameContainer);
            
            // 添加角色图标（logo）
            const logoElement = document.createElement('div');
            logoElement.className = 'player-logo other-player-logo';
            playerElement.appendChild(logoElement);
            
            // 添加玩家信息提示
            playerElement.title = `${player.name} (等级 ${player.level || 1})`;
            
            // 设置位置 - 确保使用正确的坐标
            if (player.position_x !== undefined && player.position_y !== undefined) {
                // 直接设置位置，不需要额外计算偏移，CSS中的transform已经处理了居中
                playerElement.style.left = `${player.position_x}px`;
                playerElement.style.top = `${player.position_y}px`;
                console.log(`设置玩家 ${player.name} 位置: (${player.position_x}, ${player.position_y}), CSS位置: left=${playerElement.style.left}, top=${playerElement.style.top}`);
            } else {
                console.warn(`玩家 ${player.name} 缺少位置信息:`, player);
                // 使用默认位置
                playerElement.style.left = '100px';
                playerElement.style.top = '100px';
            }
            
            // 将玩家添加到地图
            this.gameMap.appendChild(playerElement);
        });
        
        console.log(`更新了 ${this.otherPlayers.length} 个其他玩家`);
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
    
    // 更新传送点
    updateTeleportPoints() {
        if (!this.gameMap || !this.currentMap || !this.currentMap.teleport_points) {
            console.error('地图容器或传送点数据未找到，无法更新传送点');
            return;
        }
        
        console.log(`更新传送点显示，当前传送点列表: ${this.currentMap.teleport_points.length}个传送点`);
        
        // 清除现有传送点
        document.querySelectorAll('.teleport-point').forEach(point => point.remove());
        
        // 添加传送点
        const teleportPoints = this.currentMap.teleport_points || [];
        teleportPoints.forEach(point => {
            const teleportElement = document.createElement('div');
            teleportElement.className = 'teleport-point';
            teleportElement.style.left = `${point.position_x || point.x}px`;
            teleportElement.style.top = `${point.position_y || point.y}px`;
            
            // 添加提示信息
            teleportElement.title = `进入「${point.name || '目标地图'}」`;
            
            // 创建地图名称标签
            const mapNameLabel = document.createElement('div');
            mapNameLabel.className = 'teleport-map-name';
            mapNameLabel.textContent = point.name || '目标地图';
            teleportElement.appendChild(mapNameLabel);
            
            // 添加点击事件
            teleportElement.addEventListener('click', () => {
                this.teleportToMap(point.target_map_id, point.target_x || point.target_position_x, point.target_y || point.target_position_y);
            });
            
            this.gameMap.appendChild(teleportElement);
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
        
        this.skills = skills.map(skill => {
            return {
                ...skill,
                cooldown_remaining: 0, // 添加冷却时间剩余
                last_used: null // 添加上次使用时间
            };
        });
        
        this.renderSkillsList();
        
        // 启动技能冷却检查定时器
        if (!this.skillCooldownInterval) {
            this.skillCooldownInterval = setInterval(() => this.updateSkillCooldowns(), 1000);
        }
    }
    
    // 渲染技能列表
    renderSkillsList() {
        if (!this.skillsList || !this.skills) return;
        
        this.skillsList.innerHTML = this.skills.map(skill => {
            const cooldownDisplay = skill.cooldown_remaining > 0 ? 
                `<div class="skill-cooldown">${skill.cooldown_remaining}秒</div>` : '';
            
            return `
                <div class="skill" data-skill-id="${skill.id}">
                    <div class="skill-icon">${skill.skill.icon || '技'}</div>
                    <div class="skill-info">
                        <div>${skill.skill.name} Lv.${skill.level}</div>
                        <div>MP消耗：${skill.skill.mp_cost}</div>
                        ${cooldownDisplay}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 更新技能冷却时间
    updateSkillCooldowns() {
        let needsUpdate = false;
        
        this.skills.forEach(skill => {
            if (skill.cooldown_remaining > 0) {
                skill.cooldown_remaining--;
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            this.renderSkillsList();
        }
    }
    
    // 使用技能
    async useSkill(skillId, monsterId) {
        try {
            // 找到技能对象
            const skillObj = this.skills.find(s => s.id === parseInt(skillId));
            if (!skillObj) {
                console.error('未找到技能:', skillId);
                return;
            }
            
            // 检查技能是否在冷却中
            if (skillObj.cooldown_remaining > 0) {
                this.addMessage(`技能 ${skillObj.skill.name} 正在冷却中，剩余 ${skillObj.cooldown_remaining} 秒`, 'warning');
                return;
            }
            
            const response = await axios.post('/api/skill/use', {
                skill_id: skillId,
                monster_id: monsterId
            });
            
            // 设置技能冷却时间
            skillObj.cooldown_remaining = skillObj.skill.cooldown || 0;
            skillObj.last_used = new Date();
            this.renderSkillsList();
            
            // 添加技能使用信息到响应数据中
            if (!response.data.skill_used) {
                response.data.skill_used = {
                    id: skillObj.id,
                    name: skillObj.skill.name,
                    level: skillObj.level
                };
            }
            
            this.handleCombatResult(response.data);
        } catch (error) {
            console.error('使用技能失败:', error);
            this.addMessage('使用技能失败');
        }
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
        
        // 移除所有现有的物品弹出窗口
        document.querySelectorAll('.item-tooltip').forEach(tooltip => tooltip.remove());
        
        this.inventoryList.innerHTML = inventory.map(item => `
            <div class="item" data-item-id="${item.id}">
                <div class="item-icon">${item.item.image || '物'}</div>
                ${item.quantity > 1 ? `<span class="item-badge">${item.quantity}</span>` : ''}
                ${item.is_equipped ? '<span class="item-equipped">已装备</span>' : ''}
            </div>
        `).join('');
        
        // 添加鼠标悬停事件
        document.querySelectorAll('#inventory-list .item').forEach(itemElement => {
            const itemId = itemElement.dataset.itemId;
            const inventoryItem = this.inventory.find(i => i.id === parseInt(itemId));
            
            if (inventoryItem) {
                // 点击物品显示弹出窗口
                itemElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    
                    // 移除所有现有的物品弹出窗口
                    document.querySelectorAll('.item-tooltip').forEach(tooltip => tooltip.remove());
                    
                    // 创建物品信息弹出窗口
                    const tooltip = document.createElement('div');
                    tooltip.className = 'item-tooltip';
                    tooltip.innerHTML = `
                        <div class="item-tooltip-header">
                            <div class="item-tooltip-icon">${inventoryItem.item.image || '物'}</div>
                            <div class="item-tooltip-title">
                                <div class="item-tooltip-name">${inventoryItem.item.name}</div>
                                <div class="item-tooltip-quantity">数量: ${inventoryItem.quantity}</div>
                            </div>
                            <div class="tooltip-close">×</div>
                        </div>
                        <div class="item-tooltip-description">${inventoryItem.item.description || '无描述'}</div>
                        ${this.getItemAttributesHTML(inventoryItem.item)}
                        ${inventoryItem.is_equipped ? '<div class="item-tooltip-equipped">已装备</div>' : ''}
                        <div class="item-tooltip-actions">
                            ${inventoryItem.item.is_consumable ? 
                                `<button class="item-action-btn use-btn" data-action="use" data-item-id="${inventoryItem.id}">使用</button>` : ''}
                            ${this.isEquippableItem(inventoryItem.item) ? 
                                (inventoryItem.is_equipped ? 
                                    `<button class="item-action-btn unequip-btn" data-action="unequip" data-item-id="${inventoryItem.id}">卸下</button>` : 
                                    `<button class="item-action-btn equip-btn" data-action="equip" data-item-id="${inventoryItem.id}">装备</button>`) 
                                : ''}
                            <button class="item-action-btn drop-btn" data-action="drop" data-item-id="${inventoryItem.id}">丢弃</button>
                        </div>
                    `;
                    
                    // 将弹出窗口添加到文档中
                    document.body.appendChild(tooltip);
                    this.positionTooltip(tooltip, e);
                    
                    // 添加关闭按钮点击事件
                    tooltip.querySelector('.tooltip-close').addEventListener('click', (event) => {
                        event.stopPropagation(); // 阻止事件冒泡
                        if (tooltip.parentNode) {
                            tooltip.parentNode.removeChild(tooltip);
                        }
                    });
                    
                    // 添加按钮点击事件
                    tooltip.querySelectorAll('.item-action-btn').forEach(btn => {
                        btn.addEventListener('click', (event) => {
                            event.stopPropagation(); // 阻止事件冒泡
                            const action = btn.dataset.action;
                            const itemId = parseInt(btn.dataset.itemId);
                            
                            // 根据动作类型调用相应方法
                            switch(action) {
                                case 'use':
                                    this.useItem(itemId);
                                    break;
                                case 'equip':
                                    this.equipItem(itemId);
                                    break;
                                case 'unequip':
                                    this.unequipItem(itemId);
                                    break;
                                case 'drop':
                                    this.dropItem(itemId);
                                    break;
                            }
                            
                            // 移除弹出窗口
                            if (tooltip.parentNode) {
                                tooltip.parentNode.removeChild(tooltip);
                            }
                        });
                    });
                    
                    // 点击文档其他地方关闭弹出窗口
                    const closeTooltip = (event) => {
                        if (!tooltip.contains(event.target) && !itemElement.contains(event.target)) {
                            if (tooltip.parentNode) {
                                tooltip.parentNode.removeChild(tooltip);
                                document.removeEventListener('click', closeTooltip);
                            }
                        }
                    };
                    
                    // 延迟添加点击事件，避免立即触发
                    setTimeout(() => {
                        document.addEventListener('click', closeTooltip);
                    }, 100);
                });
            }
        });
    }
    
    // 购买物品
    async buyItem(shopItemId, quantity = 1) {
        try {
            const response = await axios.post('/api/shop/buy', {
                shop_item_id: shopItemId,
                quantity: quantity
            });
            
            console.log('购买物品响应:', response.data);
            
            if (response.data.success) {
                // 更新角色金币
                this.character.gold = response.data.current_gold;
                
                // 更新玩家金币显示
                const playerGoldEl = document.querySelector('.player-gold');
                if (playerGoldEl) {
                    playerGoldEl.textContent = `您的金币: ${this.character.gold}`;
                }
                
                // 更新商店名称中的金币显示
                const shopNameEl = document.getElementById('shop-name');
                if (shopNameEl) {
                    const shopName = shopNameEl.textContent.split('您的金币:')[0];
                    shopNameEl.innerHTML = `${shopName}您的金币: ${this.character.gold}`;
                }
                
                // 更新物品列表
                if (response.data.inventory) {
                    this.updateInventoryList(response.data.inventory);
                }
                
                // 更新商店物品的可购买状态
                this.updateShopItemsAffordability();
                
                // 显示购买成功消息
                const quantityText = quantity > 1 ? `${quantity}个` : '';
                this.addMessage(`成功购买${quantityText} ${response.data.item_name}`, 'success');
                this.addMessage(`剩余金币: ${this.character.gold}`, 'gold');
            } else {
                this.addMessage(response.data.message || '购买失败', 'error');
            }
        } catch (error) {
            console.error('购买物品失败:', error);
            let errorMessage = '购买失败';
            
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
            }
            
            this.addMessage(errorMessage, 'error');
        }
    }
    
    // 更新商店物品的可购买状态
    updateShopItemsAffordability() {
        const shopItems = document.querySelectorAll('.shop-item');
        shopItems.forEach(item => {
            const price = parseInt(item.dataset.price || 0);
            
            // 获取当前选中的数量
            const selectedQuantityBtn = item.querySelector('.quantity-btn.selected');
            const quantity = selectedQuantityBtn ? parseInt(selectedQuantityBtn.dataset.quantity) : 1;
            
            // 计算总价
            const totalPrice = price * quantity;
            
            // 判断是否有足够的金币
            const canAfford = (this.character.gold || 0) >= totalPrice;
            
            // 更新样式类
            if (canAfford) {
                item.classList.remove('cannot-afford');
                item.classList.add('can-afford');
                
                // 更新价格显示
                const priceEl = item.querySelector('.shop-item-price');
                if (priceEl) {
                    priceEl.innerHTML = `价格：${price}金币 × ${quantity} = ${totalPrice}金币`;
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
                    priceEl.innerHTML = `价格：${price}金币 × ${quantity} = ${totalPrice}金币 <span class="not-enough">(金币不足)</span>`;
                }
                
                // 更新按钮
                const buyBtn = item.querySelector('.buy-btn');
                if (buyBtn) {
                    buyBtn.classList.add('disabled');
                    buyBtn.setAttribute('title', '金币不足');
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
            
            // 处理消息，添加颜色
            let message = response.data.message;
            
            // 检查是否包含恢复生命值的信息
            if (message.includes('恢复了') && message.includes('点生命值')) {
                // 提取恢复的生命值数量
                const hpMatch = message.match(/恢复了(\d+)点生命值/);
                if (hpMatch && hpMatch[1]) {
                    const hpAmount = hpMatch[1];
                    // 替换为带颜色的文本
                    message = message.replace(
                        `恢复了${hpAmount}点生命值`, 
                        `恢复了 <span style="color: #2ecc71">+${hpAmount} HP</span>`
                    );
                }
            }
            
            // 检查是否包含恢复魔法值的信息
            if (message.includes('恢复了') && message.includes('点魔法值')) {
                // 提取恢复的魔法值数量
                const mpMatch = message.match(/恢复了(\d+)点魔法值/);
                if (mpMatch && mpMatch[1]) {
                    const mpAmount = mpMatch[1];
                    // 替换为带颜色的文本
                    message = message.replace(
                        `恢复了${mpAmount}点魔法值`, 
                        `恢复了 <span style="color: #3498db">+${mpAmount} MP</span>`
                    );
                }
            }
            
            this.addMessage(message);
            
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
            this.addMessage(error.response.data.message || '装备物品失败');
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
            if (result.character) {
                this.character = result.character;
                this.updateCharacterInfo();
            }
            
            // 构建消息
            let message = '';
            let messageType = 'combat';
            
            // 获取怪物名称
            const monsterName = result.monster ? result.monster.name : '怪物';
            
            // 如果使用了技能，显示技能信息
            if (result.skill_used) {
                message = `${monsterName} <span style="color: red">-${result.damage} HP</span>（技能【${result.skill_used.name}】）`;
            } else {
                message = `${monsterName} <span style="color: red">-${result.damage} HP</span>`;
            }
            
            // 处理怪物反击
            if (result.monster_damage) {
                message += `，我 <span style="color: red">-${result.monster_damage} HP</span>`;
                
                // 如果角色死亡
                if (result.character_died) {
                    this.addMessage(message, 'error');
                    this.addMessage(result.respawn_message, 'warning');
                    
                    // 关闭怪物模态框
                    const monsterModal = document.getElementById('monster-modal');
                    if (monsterModal) {
                        monsterModal.style.display = 'none';
                    }
                    
                    // 重新加载地图数据（因为角色被传送回新手村）
                    this.loadMapData();
                    return;
                }
            }
            
            if (result.monster_killed) {
                message += `，<span style="color: gold">+${result.gold_gained} 金币</span>，<span style="color: purple">+${result.exp_gained} 经验</span>`;
                
                if (result.leveled_up) {
                    message += `，<span style="color: orange; font-weight: bold">升级到 ${result.new_level} 级！</span>`;
                    messageType = 'success';  // 升级使用success类型
                }
                
                // 如果有物品掉落
                if (result.dropped_items && result.dropped_items.length > 0) {
                    message += `，获得物品：`;
                    result.dropped_items.forEach((item, index) => {
                        message += `<span style="color: ${this.getItemRarityColor(item.rarity)}">${item.item_name} x${item.quantity}</span>`;
                        if (index < result.dropped_items.length - 1) {
                            message += '、';
                        }
                    });
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
        console.log('处理游戏事件:', event);
        
        if (!event || !event.type) {
            console.warn('收到无效的游戏事件:', event);
            return;
        }
        
        // 根据事件类型分发到不同的处理函数
        switch (event.type) {
            case 'character.move':
                this.handleCharacterMove(event.data);
                break;
                
            case 'character.enter':
                this.handleCharacterEnter(event.data);
                break;
                
            case 'character.leave':
                this.handleCharacterExit(event.data);
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
                
            case 'map.updated':
                this.handleMapUpdated(event.data);
                break;
                
            default:
                console.warn('未知的游戏事件类型:', event.type);
                break;
        }
    }
    
    // 处理角色移动事件
    handleCharacterMove(data) {
        // 确保数据完整且不是当前玩家自己
        if (!data || !data.character || !data.character.id || data.character.id === this.character.id) {
            console.log('忽略移动事件:', data);
            return;
        }
        
        console.log('收到角色移动事件:', data);
        
        // 查找或创建玩家元素
        let playerElement = document.querySelector(`.other-player[data-player-id="${data.character.id}"]`);
        
        if (!playerElement) {
            console.log('创建新的玩家元素:', data.character);
            playerElement = document.createElement('div');
            playerElement.className = 'player other-player';
            playerElement.dataset.playerId = data.character.id;
            
            // 添加玩家名称和等级显示
            playerElement.innerHTML = `${data.character.name} <span class="player-level">Lv.${data.character.level || 1}</span>`;
            
            // 添加玩家信息提示
            playerElement.title = `${data.character.name} (等级 ${data.character.level || 1})`;
            
            // 设置初始位置 - 使用绝对位置
            // 直接设置位置，CSS中的transform已经处理了居中
            playerElement.style.left = `${data.character.position_x}px`;
            playerElement.style.top = `${data.character.position_y}px`;
            
            console.log(`设置新玩家 ${data.character.name} 初始位置: (${data.character.position_x}, ${data.character.position_y}), CSS位置: left=${playerElement.style.left}, top=${playerElement.style.top}`);
            
            // 将玩家添加到地图
            if (this.gameMap) {
                this.gameMap.appendChild(playerElement);
                console.log('玩家元素已添加到地图');
                
                // 添加玩家进入位置的提示
                this.addMessage(`${data.character.name} 出现在位置 (${data.character.position_x}, ${data.character.position_y})`);
            } else {
                console.error('找不到地图容器');
                return;
            }
            
            // 添加到其他玩家列表
            if (!this.otherPlayers.find(p => p.id === data.character.id)) {
                this.otherPlayers.push(data.character);
                console.log('玩家已添加到列表');
            }
        } else {
            // 获取当前位置
            const currentX = parseFloat(playerElement.style.left);
            const currentY = parseFloat(playerElement.style.top);
            const targetX = data.character.position_x;
            const targetY = data.character.position_y;
            
            // 计算移动距离
            const distance = Math.sqrt(Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2));
            
            // 根据移动距离调整动画时间
            const baseAnimationTime = 300; // 基础动画时间（毫秒）
            const animationTime = Math.min(baseAnimationTime, Math.max(distance / 2, 100)); // 根据距离调整，但不超过基础时间
            
            console.log(`玩家 ${data.character.name} 移动: (${currentX}, ${currentY}) -> (${targetX}, ${targetY}), 距离: ${distance}, 动画时间: ${animationTime}ms`);
            
            // 添加移动提示消息
            this.addMessage(`${data.character.name} 移动到位置 (${targetX}, ${targetY})`);
            
            // 添加移动动画类
            playerElement.classList.add('moving');
            
            // 更新玩家位置（直接设置位置）
            playerElement.style.transition = `left ${animationTime}ms ease-out, top ${animationTime}ms ease-out`;
            // 直接设置位置，CSS中的transform已经处理了居中
            playerElement.style.left = `${targetX}px`;
            playerElement.style.top = `${targetY}px`;
            
            console.log(`更新玩家 ${data.character.name} 位置: (${targetX}, ${targetY}), CSS位置: left=${playerElement.style.left}, top=${playerElement.style.top}`);
            
            // 移动完成后更新实际位置
            setTimeout(() => {
                playerElement.classList.remove('moving');
                playerElement.style.transition = 'none';
                
                // 更新玩家列表中的位置
                const playerIndex = this.otherPlayers.findIndex(p => p.id === data.character.id);
                if (playerIndex !== -1) {
                    this.otherPlayers[playerIndex].position_x = targetX;
                    this.otherPlayers[playerIndex].position_y = targetY;
                }
                
                console.log(`玩家 ${data.character.name} 移动完成, 最终位置: (${targetX}, ${targetY})`);
            }, animationTime);
        }
    }
    
    // 处理角色进入地图事件
    handleCharacterEnter(data) {
        if (!data || !data.character) {
            console.warn('接收到无效的角色进入事件:', data);
            return;
        }

        const character = data.character;
        
        // 确保不是当前玩家自己
        if (character.id === this.character.id) {
            console.log('忽略自己的角色进入事件');
            return;
        }
        
        console.log('角色进入地图:', character);
        
        // 检查是否已存在该玩家
        const existingPlayerIndex = this.otherPlayers.findIndex(p => p.id === character.id);
        
        if (existingPlayerIndex !== -1) {
            // 更新现有玩家信息
            this.otherPlayers[existingPlayerIndex] = character;
            console.log('更新现有玩家信息:', character);
        } else {
            // 添加新玩家到列表中
            this.otherPlayers.push(character);
            console.log('添加新玩家到列表:', character);
        }
        
        // 更新玩家显示
        this.updateOtherPlayers();
        
        // 显示消息
        this.addMessage(`${character.name} 进入了地图`);
    }
    
    // 处理角色离开地图事件
    handleCharacterExit(data) {
        if (!data || !data.character_id) {
            console.warn('接收到无效的角色离开事件:', data);
            return;
        }
        
        const characterId = data.character_id;
        
        // 确保不是当前玩家自己
        if (characterId === this.character.id) {
            console.log('忽略自己的角色离开事件');
            return;
        }
        
        console.log('角色离开地图:', characterId);
        
        // 查找离开的玩家
        const leavingPlayer = this.otherPlayers.find(p => p.id === characterId);
        const playerName = leavingPlayer ? leavingPlayer.name : '一位玩家';
        
        // 从列表中移除玩家
        this.otherPlayers = this.otherPlayers.filter(p => p.id !== characterId);
        
        // 更新玩家显示
        this.updateOtherPlayers();
        
        // 显示消息
        this.addMessage(`${playerName} 离开了地图`);
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
            
            // 更新地图上怪物的血条
            const monsterElement = document.querySelector(`.monster[data-monster-id="${data.monster_id}"]`);
            if (monsterElement) {
                const hpBar = monsterElement.querySelector('.monster-hp-bar');
                if (hpBar) {
                    hpBar.style.width = `${data.hp_percentage}%`;
                }
                
                const hpText = monsterElement.querySelector('.monster-hp-text');
                if (hpText) {
                    hpText.textContent = `${data.current_hp}/${monster.hp}`;
                }
            }
            
            if (data.attacker_id !== this.character.id) {
                // 如果使用了技能，显示技能信息
                if (data.skill_used) {
                    this.addMessage(`${data.attacker_name}使用技能【${data.skill_used.name}】对${data.monster_name}造成${data.damage}点伤害`);
                } else {
                    this.addMessage(`${data.attacker_name}对${data.monster_name}造成${data.damage}点伤害`);
                }
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
    
    // 处理地图更新事件
    handleMapUpdated(data) {
        this.addMessage(data.message, 'info');
        
        // 如果更新的是当前地图，则重新加载地图数据
        if (this.currentMap && data.map_id === this.currentMap.id) {
            this.loadMapData().then(() => {
                this.addMessage('地图数据已更新', 'success');
            });
        }
    }
    
    // 添加游戏消息
    addMessage(message, type = 'info') {
        if (!this.messages) {
            console.warn('消息容器未找到，无法显示消息:', message);
            return;
        }
        
        const messageElement = document.createElement('p');
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
        
        // 使用innerHTML设置消息内容，以支持HTML标签
        messageElement.innerHTML = prefix + message;
        
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
    
    // 清理游戏资源
    cleanup() {
        // ... existing code ...
        
        // 清理技能冷却定时器
        if (this.skillCooldownInterval) {
            clearInterval(this.skillCooldownInterval);
            this.skillCooldownInterval = null;
        }
        
        // ... existing code ...
    }

    // 直接攻击怪物（不弹出模态窗口）
    async directAttackMonster(monsterId) {
        try {
            console.log('直接攻击怪物，ID:', monsterId);
            
            // 保存当前攻击的怪物ID
            this.currentAttackingMonsterId = monsterId;
            
            // 开启自动攻击
            this.isAutoAttacking = true;
            
            // 发送测试请求记录数据
            await axios.post('/api/test/log', { 
                action: 'direct_attack_monster',
                monster_id: monsterId,
                timestamp: new Date().toISOString()
            });
            
            const response = await axios.post('/api/monster/attack', { monster_id: monsterId });
            console.log('攻击怪物响应:', response.data);
            
            // 更新怪物信息
            if (response.data.monster) {
                const monster = this.monsters.find(m => m.id === parseInt(monsterId));
                if (monster) {
                    monster.current_hp = response.data.monster.current_hp;
                    monster.hp_percentage = (response.data.monster.current_hp / response.data.monster.hp) * 100;
                    
                    // 检查怪物是否已死亡
                    if (response.data.monster_killed) {
                        monster.is_dead = true;
                        // 怪物已死亡，停止自动攻击
                        this.isAutoAttacking = false;
                    } else {
                        // 怪物未死亡，继续自动攻击
                        setTimeout(() => {
                            if (this.isAutoAttacking && this.currentAttackingMonsterId === monsterId) {
                                this.directAttackMonster(monsterId);
                            }
                        }, 1000); // 每秒攻击一次
                    }
                    
                    // 更新怪物显示（包括血条）
                    this.updateMonsters();
                }
            }
            
            // 如果后端使用了技能，更新相应技能的冷却时间
            if (response.data.skill_used) {
                const skillObj = this.skills.find(s => s.id === parseInt(response.data.skill_used.id));
                if (skillObj) {
                    skillObj.cooldown_remaining = skillObj.skill.cooldown || 0;
                    skillObj.last_used = new Date();
                    this.renderSkillsList();
                }
            }
            
            this.handleCombatResult(response.data);
            
        } catch (error) {
            console.error('攻击失败:', error);
            this.addMessage('攻击失败', 'error');
            
            // 如果攻击失败但仍在自动攻击模式，尝试继续
            if (this.isAutoAttacking && this.currentAttackingMonsterId) {
                setTimeout(() => {
                    if (this.isAutoAttacking) {
                        this.directAttackMonster(this.currentAttackingMonsterId);
                    }
                }, 2000); // 失败后2秒再试
            }
        }
    }

    // 停止自动攻击
    stopAutoAttack() {
        if (this.isAutoAttacking) {
            this.isAutoAttacking = false;
            this.currentAttackingMonsterId = null;
            this.addMessage('停止自动攻击', 'system');
        }
    }

    // 判断物品是否可装备
    isEquippableItem(item) {
        if (!item || !item.type) return false;
        
        // 可装备的物品类型列表
        const equippableTypes = [
            'equipment', 'weapon', 'armor', 'accessory', 'bracelet',
            'helmet', 'gloves', 'boots', 'ring', 'necklace', 'belt'
        ];
        
        return equippableTypes.includes(item.type);
    }
    
    // 获取物品属性HTML
    getItemAttributesHTML(item) {
        if (!item) return '';
        
        let attributesHTML = '<div class="item-tooltip-attributes">';
        
        // 添加物品类型
        if (item.type) {
            attributesHTML += `<div class="item-attribute">类型: ${this.getItemTypeName(item.type)}</div>`;
        }
        
        // 添加物品稀有度
        if (item.rarity) {
            attributesHTML += `<div class="item-attribute item-rarity-${item.rarity}">稀有度: ${this.getItemRarityName(item.rarity)}</div>`;
        }
        
        // 添加物品属性加成
        if (item.hp_bonus > 0) attributesHTML += `<div class="item-attribute item-bonus">生命值: +${item.hp_bonus}</div>`;
        if (item.mp_bonus > 0) attributesHTML += `<div class="item-attribute item-bonus">魔法值: +${item.mp_bonus}</div>`;
        if (item.attack_bonus > 0) attributesHTML += `<div class="item-attribute item-bonus">攻击力: +${item.attack_bonus}</div>`;
        if (item.defense_bonus > 0) attributesHTML += `<div class="item-attribute item-bonus">防御力: +${item.defense_bonus}</div>`;
        
        // 添加物品价值
        if (item.price > 0) {
            attributesHTML += `<div class="item-attribute">价值: ${item.price}金币</div>`;
        }
        
        attributesHTML += '</div>';
        return attributesHTML;
    }
    
    // 获取物品类型名称
    getItemTypeName(type) {
        const typeNames = {
            'weapon': '武器',
            'armor': '护甲',
            'accessory': '饰品',
            'consumable': '消耗品',
            'material': '材料',
            'quest': '任务物品',
            'skill_book': '技能书',
            'equipment': '装备'
        };
        return typeNames[type] || type;
    }
    
    // 获取物品稀有度名称
    getItemRarityName(rarity) {
        const rarityNames = {
            1: '普通',
            2: '优秀',
            3: '精良',
            4: '史诗',
            5: '传说'
        };
        return rarityNames[rarity] || '未知';
    }
    
    // 获取物品稀有度对应的颜色
    getItemRarityColor(rarity) {
        const rarityColors = {
            1: '#ffffff', // 普通 - 白色
            2: '#1eff00', // 优秀 - 绿色
            3: '#0070dd', // 精良 - 蓝色
            4: '#a335ee', // 史诗 - 紫色
            5: '#ff8000'  // 传说 - 橙色
        };
        return rarityColors[rarity] || '#ffffff';
    }
    
    // 定位工具提示
    positionTooltip(tooltip, event) {
        const padding = 10;
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        // 计算位置，避免超出视口
        let left = event.clientX + padding;
        let top = event.clientY + padding;
        
        // 检查右边界
        if (left + tooltipWidth > window.innerWidth) {
            left = event.clientX - tooltipWidth - padding;
        }
        
        // 检查下边界
        if (top + tooltipHeight > window.innerHeight) {
            top = event.clientY - tooltipHeight - padding;
        }
        
        // 设置位置
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    // 移动角色到指定位置
    async moveCharacter(x, y) {
        try {
            const response = await axios.post('/api/character/move', {
                position_x: x,
                position_y: y
            });
            
            if (response.data.success) {
                // 更新角色位置
                this.character.position_x = response.data.character.position_x;
                this.character.position_y = response.data.character.position_y;
                
                // 更新角色位置显示
                this.updatePlayerPosition();
                
                console.log(`角色移动到: (${this.character.position_x}, ${this.character.position_y})`);
            } else {
                console.error('移动失败:', response.data.message);
                this.addMessage(response.data.message || '移动失败', 'error');
            }
        } catch (error) {
            console.error('移动请求失败:', error);
            this.addMessage('移动失败，请重试', 'error');
        }
    }
    
    // 传送到指定地图的指定位置
    async teleportToMap(mapId, x, y) {
        try {
            // 添加传送动画效果
            const playerElement = document.querySelector('.player:not(.other-player)');
            if (playerElement) {
                playerElement.classList.add('teleporting');
                
                // 延迟发送传送请求，等待动画播放
                setTimeout(async () => {
                    try {
                        const response = await axios.post('/api/character/teleport', {
                            map_id: mapId,
                            position_x: x,
                            position_y: y
                        });
                        
                        if (response.data.success) {
                            // 更新角色位置和地图
                            this.character.current_map_id = mapId;
                            this.character.position_x = response.data.character.position_x || x;
                            this.character.position_y = response.data.character.position_y || y;
                            
                            // 添加传送完成动画
                            playerElement.classList.remove('teleporting');
                            playerElement.classList.add('teleport-complete');
                            
                            // 延迟加载新地图，等待动画完成
                            setTimeout(() => {
                                playerElement.classList.remove('teleport-complete');
                                
                                // 加载新地图数据
                                this.loadMapData().then(() => {
                                    // 重新初始化WebSocket连接（因为地图已更改）
                                    this.initWebSocket();
                                    
                                    this.addMessage(`成功传送到 ${response.data.map_name || '新地图'}`, 'success');
                                });
                            }, 800); // 传送完成动画时间
                        } else {
                            // 移除动画类
                            playerElement.classList.remove('teleporting');
                            
                            console.error('传送失败:', response.data.message);
                            this.addMessage(response.data.message || '传送失败', 'error');
                        }
                    } catch (requestError) {
                        // 移除动画类
                        playerElement.classList.remove('teleporting');
                        
                        console.error('传送请求失败:', requestError);
                        this.addMessage('传送失败，请重试', 'error');
                    }
                }, 1000); // 传送动画时间
            } else {
                // 如果找不到玩家元素，直接发送请求
                const response = await axios.post('/api/character/teleport', {
                    map_id: mapId,
                    position_x: x,
                    position_y: y
                });
                
                if (response.data.success) {
                    // 更新角色位置和地图
                    this.character.current_map_id = mapId;
                    this.character.position_x = response.data.character.position_x || x;
                    this.character.position_y = response.data.character.position_y || y;
                    
                    // 加载新地图数据
                    this.loadMapData().then(() => {
                        // 重新初始化WebSocket连接（因为地图已更改）
                        this.initWebSocket();
                        
                        this.addMessage(`成功传送到 ${response.data.map_name || '新地图'}`, 'success');
                    });
                } else {
                    console.error('传送失败:', response.data.message);
                    this.addMessage(response.data.message || '传送失败', 'error');
                }
            }
        } catch (error) {
            console.error('传送请求失败:', error);
            this.addMessage('传送失败，请重试', 'error');
        }
    }
    
    // 攻击怪物
}

// 等待DOM加载完成后再创建游戏实例
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    window.game = new Game();
}); 