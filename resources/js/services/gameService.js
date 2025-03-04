// 游戏服务 - 作为入口点，将功能委托给其他专门的服务
class GameService {
    // 加载游戏数据
    async loadGameData() {
        const characterService = await import('./characterService');
        return characterService.default.loadGameData();
    }
    
    // 初始化WebSocket连接（带数据）
    async initWebSocketWithData(characterData, mapData) {
        const websocketService = await import('./websocketService');
        return websocketService.default.initWebSocketWithData(characterData, mapData);
    }
    
    // 处理角色移动事件
    async handleCharacterMove(data) {
        const characterService = await import('./characterService');
        return characterService.default.handleCharacterMove(data);
    }
    
    // 处理角色进入事件
    async handleCharacterEnter(data) {
        const characterService = await import('./characterService');
        return characterService.default.handleCharacterEnter(data);
    }
    
    // 处理角色离开事件
    async handleCharacterLeave(data) {
        const characterService = await import('./characterService');
        return characterService.default.handleCharacterLeave(data);
    }
    
    // 处理怪物被击杀事件
    async handleMonsterKilled(data) {
        const combatService = await import('./combatService');
        return combatService.default.handleMonsterKilled(data);
    }
    
    // 处理怪物即将重生事件
    async handleMonsterRespawning(data) {
        const combatService = await import('./combatService');
        return combatService.default.handleMonsterRespawning(data);
    }
    
    // 处理怪物重生事件
    async handleMonsterRespawned(data) {
        const combatService = await import('./combatService');
        return combatService.default.handleMonsterRespawned(data);
    }
    
    // 处理怪物点击
    async handleMonsterClick(monsterId) {
        const combatService = await import('./combatService');
        return combatService.default.handleMonsterClick(monsterId);
    }
    
    // 处理商店点击
    async handleShopClick(shopId) {
        const npcService = await import('./npcService');
        return npcService.default.handleShopClick(shopId);
    }
    
    // 处理NPC点击
    async handleNpcClick(npcId) {
        const npcService = await import('./npcService');
        return npcService.default.handleNpcClick(npcId);
    }
    
    // 处理传送点点击
    async handleTeleportClick(teleportId) {
        const mapService = await import('./mapService');
        return mapService.default.handleTeleportClick(teleportId);
    }
    
    // 移动角色
    async moveCharacter(position_x, position_y) {
        const characterService = await import('./characterService');
        return characterService.default.moveCharacter(position_x, position_y);
    }
    
    // 使用物品
    async useItem(itemId) {
        const inventoryService = await import('./inventoryService');
        return inventoryService.default.useItem(itemId);
    }
    
    // 装备物品
    async equipItem(itemId) {
        const inventoryService = await import('./inventoryService');
        return inventoryService.default.equipItem(itemId);
    }
    
    // 卸下装备
    async unequipItem(itemId) {
        const inventoryService = await import('./inventoryService');
        return inventoryService.default.unequipItem(itemId);
    }
    
    // 丢弃物品
    async dropItem(itemId) {
        const inventoryService = await import('./inventoryService');
        return inventoryService.default.dropItem(itemId);
    }
    
    // 购买物品
    async buyItem(shopItemId, quantity = 1) {
        const inventoryService = await import('./inventoryService');
        return inventoryService.default.buyItem(shopItemId, quantity);
    }
    
    // 开始自动攻击
    async startAutoAttack(monsterId) {
        const combatService = await import('./combatService');
        return combatService.default.startAutoAttack(monsterId);
    }
    
    // 停止自动攻击
    async stopAutoAttack() {
        const combatService = await import('./combatService');
        return combatService.default.stopAutoAttack();
    }
    
    // 处理角色受伤事件
    async handleCharacterDamaged(data) {
        const combatService = await import('./combatService');
        return combatService.default.handleCharacterDamaged(data);
    }
    
    // 处理战斗更新事件
    async handleCombatUpdate(data) {
        const combatService = await import('./combatService');
        return combatService.default.handleCombatUpdate(data);
    }
    
    // 处理角色治疗事件
    async handleCharacterHealed(data) {
        const combatService = await import('./combatService');
        return combatService.default.handleCharacterHealed(data);
    }
    
    // 处理角色死亡事件
    async handleCharacterDied(data) {
        const combatService = await import('./combatService');
        return combatService.default.handleCharacterDied(data);
    }
    
    // 处理角色复活事件
    async handleCharacterRespawned(data) {
        const combatService = await import('./combatService');
        return combatService.default.handleCharacterRespawned(data);
    }
    
    // 初始化WebSocket
    async initWebSocket() {
        const websocketService = await import('./websocketService');
        return websocketService.default.initWebSocket();
    }
}

// 创建单例实例
const gameService = new GameService();

export default gameService; 