import axios from 'axios';
import useGameStore from '../store/gameStore';

// 物品和背包服务 - 处理物品和背包相关的API调用和业务逻辑
class InventoryService {
    // 加载背包数据
    async loadInventory() {
        const gameStore = useGameStore.getState();
        
        try {
            // 获取背包信息
            const inventoryResponse = await axios.get('/api/inventory');
            if (!inventoryResponse.data.success) {
                throw new Error(inventoryResponse.data.message || '获取背包数据失败');
            }
            
            console.log('背包数据加载成功:', inventoryResponse.data);
            gameStore.setInventory(inventoryResponse.data.inventory || []);
            
            return inventoryResponse.data.inventory;
        } catch (error) {
            console.error('加载背包数据失败:', error);
            gameStore.addMessage(`加载背包数据失败: ${error.message}`, 'error');
            throw error;
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
                character_item_id: itemId
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
            gameStore.addMessage(error.response.data.message, 'error');
        }
    }
    
    // 卸下装备
    async unequipItem(itemId) {
        const gameStore = useGameStore.getState();
        
        try {
            const response = await axios.post('/api/inventory/unequip', {
                character_item_id: itemId
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
}

// 创建单例实例
const inventoryService = new InventoryService();

export default inventoryService; 