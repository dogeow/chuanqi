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
            
            const character = characterResponse.data.character;
            setCharacter(character);
            addMessage(`欢迎回来，${character.name}！`, 'success');
            
            // 获取当前地图信息
            addMessage('正在加载地图数据...', 'info');
            const mapResponse = await axios.get(`/api/map/${character.current_map_id}`);
            if (!mapResponse.data.success) {
                throw new Error(mapResponse.data.message || '获取地图数据失败');
            }
            
            const { map, monsters, shops, other_players, npcs, teleport_points, map_markers } = mapResponse.data;
            setCurrentMap(map);
            setMonsters(monsters || []);
            setShops(shops || []);
            setOtherPlayers(other_players || []);
            setNpcs(npcs || []);
            setTeleportPoints(teleport_points || []);
            setMapMarkers(map_markers || []);
            
            // 获取背包数据
            addMessage('正在加载背包数据...', 'info');
            const inventoryResponse = await axios.get('/api/inventory');
            if (inventoryResponse.data.success) {
                setInventory(inventoryResponse.data.inventory || []);
            } else {
                addMessage('背包数据加载失败', 'warning');
            }
            
            // 初始化WebSocket连接
            initWebSocket();
            
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
    
    // 初始化WebSocket连接
    const initWebSocket = () => {
        // 这里将实现WebSocket连接逻辑
        console.log('WebSocket连接初始化');
    };
    
    // 添加消息
    const addMessage = (message, type = 'info') => {
        setMessages(prev => [...prev, { text: message, type, timestamp: new Date() }]);
    };
    
    // 处理怪物点击
    const handleMonsterClick = (monsterId) => {
        // 这里将实现怪物点击逻辑
        console.log('点击怪物:', monsterId);
        
        // 查找怪物信息
        const monster = monsters.find(m => m.id === monsterId);
        if (monster) {
            addMessage(`你点击了怪物: ${monster.name}`, 'info');
            // 这里可以添加战斗逻辑
        }
    };
    
    // 处理商店点击
    const handleShopClick = (shopId) => {
        // 这里将实现商店点击逻辑
        console.log('点击商店:', shopId);
        
        // 查找商店信息
        const shop = shops.find(s => s.id === shopId);
        if (shop) {
            addMessage(`你点击了商店: ${shop.name}`, 'info');
            // 这里可以添加打开商店界面的逻辑
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
    const handleTeleportClick = (teleportId) => {
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
            
            // 这里可以添加传送逻辑
            addMessage(`正在传送到 ${teleport.target_map_name}...`, 'info');
            // 模拟传送过程
            setTimeout(() => {
                // 实际项目中应该调用API进行传送
                addMessage(`传送成功！欢迎来到 ${teleport.target_map_name}`, 'success');
            }, 1500);
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
            
            // 发送移动请求到服务器
            addMessage(`移动到 (${Math.round(x)}, ${Math.round(y)})`, 'info');
            
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