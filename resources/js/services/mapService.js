import axios from 'axios';
import useGameStore from '../store/gameStore';
import websocketService from './websocketService';

// 地图服务 - 处理地图相关的API调用和业务逻辑
class MapService {
    // 加载地图数据
    async loadMapData(mapId) {
        const gameStore = useGameStore.getState();
        
        try {
            console.log(`正在加载地图数据，地图ID: ${mapId}`);
            
            // 获取地图信息
            const mapResponse = await axios.get(`/api/map/${mapId}`);
            if (!mapResponse.data.success) {
                throw new Error(mapResponse.data.message || '获取地图数据失败');
            }
            
            console.log('地图数据加载成功:', mapResponse.data);
            const mapData = mapResponse.data.map;
            gameStore.setGameData(mapResponse.data);
            
            return mapData;
        } catch (error) {
            console.error('加载地图数据失败:', error);
            gameStore.addMessage(`加载地图数据失败: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // 处理传送点点击
    async handleTeleportClick(teleportId) {
        const gameStore = useGameStore.getState();
        
        try {
            const teleport = gameStore.teleportPoints.find(t => t.target_map_id === teleportId);
            if (!teleport && teleportId != 1) {
                throw new Error('传送点不存在');
            }
            
            // 计算角色和传送点之间的距离
            const character = gameStore.character;
            const characterX = character.position_x || 0;
            const characterY = character.position_y || 0;
            const teleportX = teleport?.x || teleport?.position_x || 0;
            const teleportY = teleport?.y || teleport?.position_y || 0;
            
            const dx = characterX - teleportX;
            const dy = characterY - teleportY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果距离太远，先移动到传送点附近
            if (distance > 2 && teleportId != 1) {
                // 计算移动目标点（传送点附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = teleportX + Math.round(Math.cos(angle));
                const targetY = teleportY + Math.round(Math.sin(angle));
                
                // 移动到目标点
                const characterService = await import('./characterService');
                await characterService.default.moveCharacter(targetX, targetY);
            }
            
            const response = await axios.post('/api/map/change', {
                map_id: teleportId
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || '传送失败');
            }
            
            // 离开当前地图频道
            if (window.Echo) {
                window.Echo.leave(`map.${gameStore.currentMap.id}`);
            }
            
            // 直接更新角色位置，不触发移动动画
            gameStore.updateCharacterAttributes({
                position_x: response.data.character.position_x,
                position_y: response.data.character.position_y,
                current_map_id: response.data.character.current_map_id
            });
            
            gameStore.setLoading(true);
            
            // 重新加载地图数据
            const mapData = await this.loadMapData(teleportId);
            gameStore.setLoading(false);
            
            // 初始化新地图的WebSocket连接
            websocketService.initWebSocketWithData(gameStore.character, mapData);
            
            // 定位到玩家新位置
            const viewport = document.querySelector('.map-viewport');
            if (viewport) {
                const viewportWidth = viewport.clientWidth;
                const viewportHeight = viewport.clientHeight;
                const zoomLevel = gameStore.zoomLevel;
                
                const targetX = response.data.character.position_x * zoomLevel;
                const targetY = response.data.character.position_y * zoomLevel;
                
                const scrollX = Math.max(0, targetX - (viewportWidth / 2));
                const scrollY = Math.max(0, targetY - (viewportHeight / 2));
                
                viewport.scrollTo({
                    left: Math.round(scrollX),
                    top: Math.round(scrollY),
                    behavior: 'smooth'
                });
            }
            
        } catch (error) {
            console.error('传送失败:', error);
            gameStore.addMessage(`传送失败: ${error.message}`, 'error');
            gameStore.setLoading(false);
        }
    }
}

// 创建单例实例
const mapService = new MapService();

export default mapService; 