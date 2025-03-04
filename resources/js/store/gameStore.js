import { create } from 'zustand';

// 创建游戏状态存储
const useGameStore = create((set, get) => ({
    // 状态
    character: null,
    currentMap: null,
    monsters: [],
    shops: [],
    otherPlayers: [],
    npcs: [],
    teleportPoints: [],
    mapMarkers: [],
    inventory: [],
    messages: [],
    isAutoAttacking: false,
    currentAttackingMonsterId: null,
    isLoading: true,
    
    // 碰撞状态
    collisions: {
        monsters: [],
        players: [],
        npcs: []
    },
    
    // 路径调整状态
    pathAdjustment: null,
    
    // 商店模态框状态
    shopModal: {
        isOpen: false,
        shop: null,
        shopItems: []
    },
    
    // 引用值（不会触发重新渲染）
    isLoadingStarted: false,
    recentMessages: {},
    characterEnterTimes: {},
    
    // 地图状态
    mapSize: { width: 1000, height: 1000 },
    zoomLevel: 1,
    viewportPosition: { left: 0, top: 0 },
    damageEffects: [],
    attackingMonsters: {},
    
    // 状态更新方法
    setCharacter: (character) => set({ character }),
    setCurrentMap: (map) => set({ currentMap: map }),
    setMonsters: (monsters) => set({ monsters }),
    setShops: (shops) => set({ shops }),
    setOtherPlayers: (players) => set({ otherPlayers: players }),
    setNpcs: (npcs) => set({ npcs }),
    setTeleportPoints: (points) => set({ teleportPoints: points }),
    setMapMarkers: (markers) => set({ mapMarkers: markers }),
    setInventory: (items) => set({ inventory: items }),
    setLoading: (isLoading) => set({ isLoading }),
    setLoadingStarted: (started) => set({ isLoadingStarted: started }),
    
    // 碰撞状态更新方法
    setCollisions: (collisions) => set({ collisions }),
    
    // 路径调整状态更新方法
    setPathAdjustment: (adjustment) => set({ pathAdjustment: adjustment }),
    clearPathAdjustment: () => set({ pathAdjustment: null }),
    
    // 添加碰撞
    addCollision: (type, object) => set(state => {
        // 确保不重复添加相同的碰撞对象
        const existingCollisions = state.collisions[type] || [];
        const exists = existingCollisions.some(item => item.id === object.id);
        
        if (!exists) {
            return {
                collisions: {
                    ...state.collisions,
                    [type]: [...existingCollisions, object]
                }
            };
        }
        
        return state;
    }),
    
    // 移除碰撞
    removeCollision: (type, objectId) => set(state => ({
        collisions: {
            ...state.collisions,
            [type]: (state.collisions[type] || []).filter(item => item.id !== objectId)
        }
    })),
    
    // 清除所有碰撞
    clearCollisions: () => set({
        collisions: {
            monsters: [],
            players: [],
            npcs: []
        }
    }),
    
    // 商店模态框方法
    setShopModalData: (data) => set({ shopModal: data }),
    closeShopModal: () => set({ shopModal: { isOpen: false, shop: null, shopItems: [] } }),
    
    // 更新角色位置
    updateCharacterPosition: (x, y) => set(state => ({
        character: {
            ...state.character,
            position_x: x,
            position_y: y
        }
    })),
    
    // 更新角色属性
    updateCharacterAttributes: (attributes) => set(state => ({
        character: {
            ...state.character,
            ...attributes
        }
    })),
    
    // 更新怪物状态
    updateMonster: (monsterId, updates) => set(state => ({
        monsters: state.monsters.map(monster => 
            monster.id === monsterId 
                ? { ...monster, ...updates } 
                : monster
        )
    })),
    
    // 移除怪物
    removeMonster: (monsterId) => set(state => ({
        monsters: state.monsters.filter(monster => monster.id !== monsterId)
    })),
    
    // 添加怪物
    addMonster: (monster) => set(state => ({
        monsters: [...state.monsters, monster]
    })),
    
    // 添加其他玩家
    addOtherPlayer: (player) => set(state => ({
        otherPlayers: [...state.otherPlayers.filter(p => p.id !== player.id), player]
    })),
    
    // 移除其他玩家
    removeOtherPlayer: (playerId) => set(state => ({
        otherPlayers: state.otherPlayers.filter(player => player.id !== playerId)
    })),
    
    // 更新其他玩家位置
    updateOtherPlayerPosition: (playerId, x, y, playerName = null) => set(state => {
        const logPlayerInfo = (action) => {
            console.log(
                `${action}玩家 ${playerId}${playerName ? `(${playerName})` : ''} ` +
                `位置到 (${x}, ${y})`
            );
        };

        logPlayerInfo('gameStore更新');

        const newPlayerData = {
            id: playerId,
            name: playerName || `玩家${playerId}`,
            x,
            y,
            level: 1
        };

        const existingPlayerIndex = state.otherPlayers.findIndex(
            player => player.id === playerId
        );

        if (existingPlayerIndex === -1) {
            logPlayerInfo('添加新');
            return {
                otherPlayers: [...state.otherPlayers, newPlayerData]
            };
        }

        return {
            otherPlayers: state.otherPlayers.map(player =>
                player.id === playerId
                    ? { ...player, ...newPlayerData }
                    : player
            )
        };
    }),
    
    // 添加消息
    addMessage: (text, type = 'info') => {
        // 检查是否是重复消息
        const recentMessages = { ...get().recentMessages };
        const messageKey = `${text}-${type}`;
        const now = Date.now();
        const lastMessageTime = recentMessages[messageKey] || 0;
        
        if (now - lastMessageTime < 3000) { // 3秒内的重复消息
            return;
        }
        
        // 更新最后消息时间
        recentMessages[messageKey] = now;
        set({ recentMessages });
        
        // 添加新消息
        const newMessage = {
            id: Date.now(),
            text,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        
        set(state => ({
            messages: [...state.messages.slice(-99), newMessage] // 保留最近的100条消息
        }));
    },
    
    // 设置自动攻击状态
    setAutoAttack: (isAttacking, monsterId = null) => set({
        isAutoAttacking: isAttacking,
        currentAttackingMonsterId: monsterId
    }),
    
    // 重置地图数据（用于地图切换）
    resetMapData: () => set({
        monsters: [],
        shops: [],
        otherPlayers: [],
        npcs: [],
        teleportPoints: [],
        mapMarkers: []
    }),
    
    // 更新角色进入时间（防止重复事件）
    updateCharacterEnterTime: (characterId) => {
        const characterEnterTimes = { ...get().characterEnterTimes };
        characterEnterTimes[characterId] = Date.now();
        set({ characterEnterTimes });
    },
    
    // 设置完整的游戏数据（用于初始化或地图切换）
    setGameData: (data) => set({
        currentMap: data.map,
        monsters: data.monsters || [],
        shops: data.shops || [],
        otherPlayers: data.other_players || [],
        npcs: data.npcs || [],
        teleportPoints: data.teleport_points || [],
        mapMarkers: data.map_markers || []
    }),
    
    // 地图状态更新方法
    setMapSize: (size) => set({ mapSize: size }),
    setZoomLevel: (level) => set({ zoomLevel: level }),
    setViewportPosition: (position) => set({ viewportPosition: position }),
    setDamageEffects: (effects) => set({ damageEffects: effects }),
    setAttackingMonsters: (monsters) => set({ attackingMonsters: monsters }),
    addDamageEffect: (effect) => set(state => ({
        damageEffects: [...state.damageEffects, effect]
    })),
    removeDamageEffect: (effectId) => set(state => ({
        damageEffects: state.damageEffects.filter(effect => effect.id !== effectId)
    })),
}));

export default useGameStore; 