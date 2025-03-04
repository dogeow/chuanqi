import useGameStore from '../store/gameStore';

// WebSocket服务 - 处理WebSocket连接和事件
class WebSocketService {
    // 初始化WebSocket连接（带数据）
    initWebSocketWithData(characterData, mapData) {
        const gameStore = useGameStore.getState();
        
        console.log('initWebSocketWithData被调用，参数:', { characterData, mapData });
        
        // 验证必要参数
        if (!characterData || !characterData.id) {
            console.error('角色数据无效，无法初始化WebSocket连接', characterData);
            gameStore.addMessage('无法初始化实时通信，部分功能可能不可用', 'error');
            return false;
        }
        
        if (!window.Echo) {
            console.error('Echo未初始化，无法建立WebSocket连接');
            gameStore.addMessage('无法初始化实时通信，部分功能可能不可用', 'error');
            return false;
        }
        
        if (!mapData || !mapData.id) {
            console.error('地图数据无效，无法初始化WebSocket连接', mapData);
            gameStore.addMessage('无法连接到游戏服务器，部分功能可能不可用', 'error');
            return false;
        }
        
        // 获取当前地图ID
        const mapId = mapData.id;
        
        console.log(`正在连接到地图频道: map.${mapId}`);
        
        try {
            // 检查是否已经订阅了该频道
            const channelName = `presence-map.${mapId}`;
            const existingChannel = window.Echo.connector.channels[channelName];
            
            if (existingChannel) {
                console.log(`已经订阅了地图频道 map.${mapId}，跳过重复订阅`);
                return true; // 已经连接，返回成功
            }
            
            // 如果有其他地图频道的连接，先离开
            Object.keys(window.Echo.connector.channels).forEach(channel => {
                if (channel.startsWith('presence-map.') && channel !== channelName) {
                    const oldMapId = channel.replace('presence-map.', '');
                    console.log(`离开旧地图频道: map.${oldMapId}`);
                    window.Echo.leave(`map.${oldMapId}`);
                }
            });
            
            // 动态导入所需的服务
            Promise.all([
                import('./characterService'),
                import('./combatService')
            ]).then(([characterService, combatService]) => {
                // 订阅地图频道
                window.Echo.join(`map.${mapId}`)
                    .here((users) => {
                        console.log('当前在线用户:', users);
                    })
                    .joining((user) => {
                        console.log('用户加入:', user);
                    })
                    .leaving((user) => {
                        console.log('用户离开:', user);
                    })
                    .listen('CharacterMoved', (data) => {
                        console.log('收到CharacterMoved事件:', data);
                        characterService.default.handleCharacterMove(data);
                    })
                    .listen('.game.event', (event) => {
                        let eventData = event;
                        
                        // 处理不同类型的游戏事件
                        const eventHandlers = {
                            'character.move': () => characterService.default.handleCharacterMove(eventData),
                            'monster.respawning': () => combatService.default.handleMonsterRespawning(eventData),
                            'monster.respawned': () => combatService.default.handleMonsterRespawned(eventData),
                            'monster.killed': () => combatService.default.handleMonsterKilled(eventData),
                            'character.damaged': () => combatService.default.handleCharacterDamaged(eventData.data),
                            'character.healed': () => combatService.default.handleCharacterHealed(eventData.data),
                            'character.died': () => combatService.default.handleCharacterDied(eventData.data),
                            'character.respawned': () => combatService.default.handleCharacterRespawned(eventData.data),
                            'combat.update': () => combatService.default.handleCombatUpdate(eventData.data)
                        };
                        
                        const eventType = eventData.type;
                        if (eventHandlers[eventType]) {
                            console.log(`处理${eventType}事件:`, eventData);
                            eventHandlers[eventType]();
                        } else {
                            console.log('未处理的game.event类型:', eventType, eventData);
                        }
                    })
                    .listen('CharacterEntered', (data) => {
                        console.log('收到CharacterEntered事件:', data);
                        characterService.default.handleCharacterEnter(data);
                    })
                    .listen('CharacterLeft', (data) => {
                        console.log('收到CharacterLeft事件:', data);
                        characterService.default.handleCharacterLeave(data);
                    })
                    .error((error) => {
                        console.error('WebSocket连接错误:', error);
                        gameStore.addMessage('与游戏服务器的连接出现问题，请刷新页面', 'error');
                    });
            });
                
            console.log(`已成功连接到地图频道: map.${mapId}`);
            return true;
        } catch (error) {
            console.error('初始化WebSocket连接失败:', error);
            gameStore.addMessage('无法连接到游戏服务器，请检查网络连接', 'error');
            return false;
        }
    }
    
    // 初始化WebSocket
    initWebSocket() {
        const gameStore = useGameStore.getState();
        
        if (!window.Echo) {
            console.error('Echo未初始化');
            return false;
        }
        
        // 如果已经有角色和地图数据，直接初始化WebSocket
        const { character, currentMap } = gameStore;
        if (character && currentMap) {
            return this.initWebSocketWithData(character, currentMap);
        }
        
        return false;
    }
}

// 创建单例实例
const websocketService = new WebSocketService();

export default websocketService; 