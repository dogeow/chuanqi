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
    async handleTeleportClick(teleportId, teleportPosition, options = {}) {
        const gameStore = useGameStore.getState();
        
        try {
            // 如果是自动传送调用，并且已经在处理中，则直接返回
            if (options.isAutoTeleport && this._isProcessingTeleport) {
                return;
            }
            
            // 设置处理标志
            this._isProcessingTeleport = true;
            
            const teleport = gameStore.teleportPoints.find(t => t.target_map_id === teleportId);
            if (!teleport && teleportId != 1) {
                this._isProcessingTeleport = false;
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
            if (distance > 120) {
                gameStore.addMessage('距离传送点太远，请先靠近传送点', 'warning');
                
                // 计算移动目标点（传送点附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = teleportX + Math.round(Math.cos(angle));
                const targetY = teleportY + Math.round(Math.sin(angle));
                
                // 移动到目标点，并设置自动传送选项
                const characterService = await import('./characterService');
                await characterService.default.moveCharacter(targetX, targetY, {
                    isFromTeleport: true,
                    autoTeleport: true
                });
                
                // 重置处理标志
                this._isProcessingTeleport = false;
                
                // 直接返回，移动完成后会自动触发传送
                return;
            }
            
            // 如果距离适中但不够近，先移动到传送点附近
            if (distance > 2) {
                // 计算移动目标点（传送点附近1格）
                const angle = Math.atan2(dy, dx);
                const targetX = teleportX + Math.round(Math.cos(angle));
                const targetY = teleportY + Math.round(Math.sin(angle));
                
                // 移动到目标点，并设置自动传送选项
                const characterService = await import('./characterService');
                await characterService.default.moveCharacter(targetX, targetY, {
                    isFromTeleport: true,
                    autoTeleport: true
                });
                
                // 重置处理标志
                this._isProcessingTeleport = false;
                
                // 直接返回，移动完成后会自动触发传送
                return;
            }
            
            // 查找目标地图中对应的传送点（从当前地图传送到目标地图的传送点）
            const currentMapId = gameStore.currentMap.id;
            
            // 发送地图切换请求，并传递当前传送点信息
            const response = await axios.post('/api/map/change', {
                map_id: teleportId,
                from_map_id: currentMapId,
                from_teleport_x: teleportX,
                from_teleport_y: teleportY
            });
            
            if (!response.data.success) {
                this._isProcessingTeleport = false;
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
            
            // 重置处理标志
            this._isProcessingTeleport = false;
            
        } catch (error) {
            console.error('传送失败:', error);
            gameStore.addMessage(`传送失败: ${error.message}`, 'error');
            gameStore.setLoading(false);
            this._isProcessingTeleport = false;
        }
    }
}

// 创建单例实例
const mapService = new MapService();

export default mapService; 