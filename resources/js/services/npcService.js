import axios from 'axios';
import useGameStore from '../store/gameStore';

// NPC服务 - 处理NPC、商店和传送点相关的API调用和业务逻辑
class NpcService {
    constructor() {
        this._isProcessingShopClick = false;
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
    
    // 处理商店点击
    async handleShopClick(shopId, options = {}) {
        const gameStore = useGameStore.getState();
        
        try {
            // 防止重复处理
            if (this._isProcessingShopClick) {
                console.log('已经在处理商店点击，忽略重复调用');
                return;
            }
            
            console.log('开始处理商店点击:', shopId, options);
            this._isProcessingShopClick = true;
            
            const shop = gameStore.shops.find(s => s.id === shopId);
            if (!shop) {
                console.error('商店不存在:', shopId);
                this._isProcessingShopClick = false;
                throw new Error('商店不存在');
            }
            
            // 计算角色和商店之间的距离
            const character = gameStore.character;
            const characterX = character.position_x || 0;
            const characterY = character.position_y || 0;
            const shopX = shop.x || shop.position_x || 0;
            const shopY = shop.y || shop.position_y || 0;
            
            const dx = characterX - shopX;
            const dy = characterY - shopY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            console.log('角色与商店距离:', distance);
            
            // 如果是自动打开商店，跳过距离检查
            if (options.isAutoOpen) {
                console.log('自动打开商店，跳过距离检查');
                // 获取商店物品
                const response = await axios.get(`/api/shop/${shopId}`);
                if (!response.data.success) {
                    this._isProcessingShopClick = false;
                    throw new Error(response.data.message || '获取商店物品失败');
                }
                
                const shopItems = response.data.shop_items;
                
                // 设置商店数据到状态中，以便React组件可以使用
                gameStore.setShopModalData({
                    isOpen: true,
                    shop: shop,
                    shopItems: shopItems
                });
                
                this._isProcessingShopClick = false;
                return;
            }
            
            // 如果距离太远，先移动到商店附近
            if (distance > 120) {
                gameStore.addMessage('距离商店太远，请先靠近商店', 'warning');
                
                // 计算移动目标点（商店附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = shopX + Math.round(Math.cos(angle));
                const targetY = shopY + Math.round(Math.sin(angle));
                
                // 移动到目标点，并设置自动打开商店选项
                const characterService = await import('./characterService');
                this._isProcessingShopClick = false; // 先重置标志，避免死锁
                await characterService.default.moveCharacter(targetX, targetY, {
                    isFromShop: true,
                    autoOpenShop: true,
                    shopId: shopId
                });
                
                return;
            }
            
            // 如果距离适中但不够近，先移动到商店附近
            if (distance > 2) {
                // 计算移动目标点（商店附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = shopX + Math.round(Math.cos(angle));
                const targetY = shopY + Math.round(Math.sin(angle));
                
                // 移动到目标点，并设置自动打开商店选项
                const characterService = await import('./characterService');
                this._isProcessingShopClick = false; // 先重置标志，避免死锁
                await characterService.default.moveCharacter(targetX, targetY, {
                    isFromShop: true,
                    autoOpenShop: true,
                    shopId: shopId
                });
                
                return;
            }
            
            // 获取商店物品
            const response = await axios.get(`/api/shop/${shopId}`);
            if (!response.data.success) {
                this._isProcessingShopClick = false;
                throw new Error(response.data.message || '获取商店物品失败');
            }
            
            const shopItems = response.data.shop_items;
            
            // 设置商店数据到状态中，以便React组件可以使用
            gameStore.setShopModalData({
                isOpen: true,
                shop: shop,
                shopItems: shopItems
            });
            
            this._isProcessingShopClick = false;
        } catch (error) {
            console.error('打开商店失败:', error);
            gameStore.addMessage(`打开商店失败: ${error.message}`, 'error');
            this._isProcessingShopClick = false;
        }
    }
}

// 创建单例实例
const npcService = new NpcService();

export default npcService; 