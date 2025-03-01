import React, { useEffect, useState } from 'react';
import '../echo'; // 导入Echo配置
import useGame from '../hooks/useGame';
import GameMap from './GameMap.jsx';
import CharacterInfo from './CharacterInfo.jsx';
import MessageList from './MessageList.jsx';
import Inventory from './Inventory.jsx'; // 导入背包组件
import gameService from '../services/gameService';

// 游戏控制按钮组件 - 只在移动设备上显示
function GameControls({ onToggleCharacterInfo }) {
    return (
        <div className="game-controls">
            <button className="control-btn character-btn" onClick={onToggleCharacterInfo} title="角色信息">
                <span>C</span>
            </button>
        </div>
    );
}

// 侧边栏模态框组件
function SidebarModal({ title, isOpen, onClose, children }) {
    if (!isOpen) return null;
    
    return (
        <div className={`sidebar-modal ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-modal-content">
                <div className="sidebar-modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="sidebar-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

// 游戏内容组件
function GameContent() {
    // 使用Zustand store
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
        isLoading, 
        loadGameData, 
        handleMonsterClick, 
        handleShopClick, 
        handleNpcClick, 
        handleTeleportClick, 
        moveCharacter, 
        useItem, 
        equipItem, 
        unequipItem, 
        dropItem, 
        addMessage 
    } = useGame();
    
    const [showCharacterInfo, setShowCharacterInfo] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isLandscape, setIsLandscape] = useState(true);
    
    // 检查设备类型和屏幕方向
    const checkDeviceAndOrientation = () => {
        // 更精确地检测移动设备
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                              (window.innerWidth < 768);
        
        setIsMobile(isMobileDevice);
        setIsLandscape(window.innerWidth > window.innerHeight);
        
        // 如果是电脑端，自动显示角色信息和背包
        if (!isMobileDevice) {
            setShowCharacterInfo(true);
        }
    };
    
    // 初始化游戏数据
    useEffect(() => {
        console.log('Game组件已挂载，开始加载游戏数据...');
        
        // 确保Echo已初始化
        if (!window.Echo) {
            console.error('Echo未初始化，无法建立WebSocket连接');
            addMessage('无法初始化实时通信，部分功能可能不可用', 'error');
        } else {
            console.log('Echo已初始化，准备加载游戏数据');
        }
        
        loadGameData();
        
        window.addEventListener('resize', checkDeviceAndOrientation);
        checkDeviceAndOrientation();
        
        // 自动攻击逻辑
        let attackInterval = null;
        if (isAutoAttacking && currentAttackingMonsterId) {
            attackInterval = setInterval(() => {
                handleMonsterClick(currentAttackingMonsterId);
            }, 2000); // 每2秒攻击一次
        }
        
        return () => {
            window.removeEventListener('resize', checkDeviceAndOrientation);
            if (attackInterval) {
                clearInterval(attackInterval);
            }
        };
    }, [isAutoAttacking, currentAttackingMonsterId]);
    
    // 当角色或地图数据变化时，确保WebSocket连接已建立
    useEffect(() => {
        if (character && character.id && currentMap && currentMap.id) {
            console.log('角色或地图数据已更新，确保WebSocket连接已建立');
            gameService.initWebSocketWithData(character, currentMap);
        }
    }, [character?.id, currentMap?.id]); // 只在角色ID或地图ID变化时重新连接
    
    // 切换角色信息显示
    const toggleCharacterInfo = () => {
        setShowCharacterInfo(!showCharacterInfo);
    };
    
    // 如果正在加载，显示加载界面
    if (isLoading) {
        return (
            <div className="game-loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">加载中...</div>
            </div>
        );
    }
    
    // 如果没有角色数据，显示错误信息
    if (!character || !currentMap) {
        return (
            <div className="game-error">
                <div className="error-message">无法加载游戏数据，请刷新页面重试。</div>
                <button onClick={() => window.location.reload()} className="reload-btn">刷新页面</button>
            </div>
        );
    }
    
    // 如果是移动设备且是竖屏，显示旋转提示
    if (isMobile && isLandscape) {
        return (
            <div className="rotate-device">
                <div className="rotate-icon">⟳</div>
                <div className="rotate-text">请旋转设备以竖屏模式游玩</div>
            </div>
        );
    }
    
    return (
        <div className="game-layout">
            {!isMobile && (
                <div className={`vertical-sidebar ${isMobile ? 'mobile-hidden' : ''}`}>
                    <CharacterInfo character={character} />
                </div>
            )}
            
            <div className="game-content">
                <div className="game-map-container">
                    <GameMap 
                        mapData={currentMap}
                        character={character}
                        monsters={monsters}
                        shops={shops}
                        otherPlayers={otherPlayers}
                        npcs={npcs}
                        teleportPoints={teleportPoints}
                        mapMarkers={mapMarkers}
                        onMove={moveCharacter}
                        onMonsterClick={handleMonsterClick}
                        onShopClick={handleShopClick}
                        onNpcClick={handleNpcClick}
                        onTeleportClick={handleTeleportClick}
                    />
                    {/* 只在移动设备上显示控制按钮 */}
                    {isMobile && (
                        <GameControls 
                            onToggleCharacterInfo={toggleCharacterInfo}
                        />
                    )}
                </div>
                
                <div className="messages-container">
                    <MessageList messages={messages} />
                </div>
            </div>

            <div className={`inventory-sidebar ${isMobile ? 'mobile-hidden' : ''}`}>
                <div className="inventory-section">
                    <h3>背包</h3>
                    <Inventory 
                        items={inventory} 
                        onUseItem={useItem}
                        onEquipItem={equipItem}
                        onUnequipItem={unequipItem}
                        onDropItem={dropItem}
                    />
                </div>
            </div>
            
            {/* 移动设备模式下的角色信息模态框 */}
            {isMobile && (
                <SidebarModal 
                    title="角色信息" 
                    isOpen={showCharacterInfo} 
                    onClose={toggleCharacterInfo}
                >
                    <CharacterInfo character={character} />
                </SidebarModal>
            )}
        </div>
    );
}

// 游戏主组件
function Game() {
    return <GameContent />;
}

export default Game; 