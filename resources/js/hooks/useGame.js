import { useEffect } from 'react';
import useGameStore from '../store/gameStore';
import gameService from '../services/gameService';

// 游戏钩子 - 连接游戏服务和状态管理
const useGame = () => {
    // 从store获取状态
    const {
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
        isLoading
    } = useGameStore();
    
    // 初始化游戏数据
    useEffect(() => {
        gameService.loadGameData();
    }, []);
    
    // 自动攻击逻辑
    useEffect(() => {
        let attackInterval = null;
        
        if (isAutoAttacking && currentAttackingMonsterId) {
            attackInterval = setInterval(() => {
                gameService.handleMonsterClick(currentAttackingMonsterId);
            }, 1000); // 每1秒攻击一次
        }
        
        return () => {
            if (attackInterval) {
                clearInterval(attackInterval);
            }
        };
    }, [isAutoAttacking, currentAttackingMonsterId]);
    
    // 返回状态和方法
    return {
        // 状态
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
        
        // 方法
        loadGameData: gameService.loadGameData.bind(gameService),
        handleMonsterClick: gameService.handleMonsterClick.bind(gameService),
        handleShopClick: gameService.handleShopClick.bind(gameService),
        handleNpcClick: gameService.handleNpcClick.bind(gameService),
        handleTeleportClick: gameService.handleTeleportClick.bind(gameService),
        moveCharacter: gameService.moveCharacter.bind(gameService),
        useItem: gameService.useItem.bind(gameService),
        equipItem: gameService.equipItem.bind(gameService),
        unequipItem: gameService.unequipItem.bind(gameService),
        dropItem: gameService.dropItem.bind(gameService),
        buyItem: gameService.buyItem.bind(gameService),
        startAutoAttack: gameService.startAutoAttack.bind(gameService),
        stopAutoAttack: gameService.stopAutoAttack.bind(gameService),
        addMessage: useGameStore.getState().addMessage
    };
};

export default useGame; 