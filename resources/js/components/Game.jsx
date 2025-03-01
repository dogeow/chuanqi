import React, { useEffect, useState } from 'react';
import '../echo'; // 导入Echo配置
import useGame from '../hooks/useGame';
import GameMap from './GameMap.jsx';
import CharacterInfo from './CharacterInfo.jsx';
import MessageList from './MessageList.jsx';
import Inventory from './Inventory.jsx'; // 导入背包组件

// 游戏帮助组件
function GameHelp({ onClose }) {
    return (
        <div className="game-help">
            <div className="help-header">
                <h3>游戏帮助</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            <div className="help-content">
                <div className="help-section">
                    <h4>基本操作</h4>
                    <ul>
                        <li>点击地图移动角色</li>
                        <li>点击怪物进行攻击</li>
                        <li>点击商店进行交易</li>
                    </ul>
                </div>
                <div className="help-section">
                    <h4>快捷键</h4>
                    <ul>
                        <li><kbd>H</kbd> - 显示/隐藏帮助</li>
                        <li><kbd>I</kbd> - 打开/关闭背包</li>
                        <li><kbd>M</kbd> - 打开/关闭地图</li>
                        <li><kbd>ESC</kbd> - 关闭当前窗口</li>
                    </ul>
                </div>
                <div className="help-section">
                    <h4>游戏提示</h4>
                    <ul>
                        <li>升级可以提高角色属性</li>
                        <li>装备更好的物品可以增强战斗力</li>
                        <li>完成任务可以获得经验和奖励</li>
                        <li>与NPC交谈可以获取游戏信息</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// 游戏控制按钮组件 - 只在移动设备上显示
function GameControls({ onToggleCharacterInfo, onToggleInventory }) {
    return (
        <div className="game-controls">
            <button className="control-btn character-btn" onClick={onToggleCharacterInfo} title="角色信息">
                <span>C</span>
            </button>
            <button className="control-btn inventory-btn" onClick={onToggleInventory} title="背包">
                <span>I</span>
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
    
    const [showHelp, setShowHelp] = useState(false);
    const [showCharacterInfo, setShowCharacterInfo] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
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
            setShowInventory(true);
        }
    };
    
    // 初始化游戏数据
    useEffect(() => {
        loadGameData();
        
        // 添加键盘事件监听器
        const handleKeyDown = (e) => {
            if (e.key === 'h' || e.key === 'H') {
                toggleHelp();
            } else if (e.key === 'i' || e.key === 'I') {
                toggleInventory();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
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
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', checkDeviceAndOrientation);
            if (attackInterval) {
                clearInterval(attackInterval);
            }
        };
    }, [isAutoAttacking, currentAttackingMonsterId]);
    
    // 切换帮助显示
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };
    
    // 切换角色信息显示
    const toggleCharacterInfo = () => {
        setShowCharacterInfo(!showCharacterInfo);
    };
    
    // 切换背包显示
    const toggleInventory = () => {
        setShowInventory(!showInventory);
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
                <div className={`vertical-sidebar ${isMobile && isLandscape ? 'mobile-hidden' : ''}`}>
                    <CharacterInfo />
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
                            onToggleInventory={toggleInventory}
                        />
                    )}
                </div>
                
                <div className="messages-container">
                    <MessageList messages={messages} />
                </div>
            </div>
            
            {/* PC端始终显示背包，移动设备根据状态显示 */}
            {(!isMobile || (isMobile && !isLandscape) || (isMobile && isLandscape && showInventory)) && (
                <div className={`inventory-sidebar ${isMobile && isLandscape ? 'mobile-hidden' : ''}`}>
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
            )}
            
            {/* 移动设备横屏模式下的角色信息模态框 */}
            {isMobile && isLandscape && (
                <SidebarModal 
                    title="角色信息" 
                    isOpen={showCharacterInfo} 
                    onClose={toggleCharacterInfo}
                >
                    <CharacterInfo character={character} />
                </SidebarModal>
            )}
            
            {/* 移动设备横屏模式下的背包模态框 */}
            {isMobile && isLandscape && (
                <SidebarModal 
                    title="背包" 
                    isOpen={showInventory} 
                    onClose={toggleInventory}
                >
                    <div className="inventory-section">
                        <Inventory 
                            items={inventory} 
                            onUseItem={useItem}
                            onEquipItem={equipItem}
                            onUnequipItem={unequipItem}
                            onDropItem={dropItem}
                        />
                    </div>
                </SidebarModal>
            )}
            
            {showHelp && <GameHelp onClose={toggleHelp} />}
        </div>
    );
}

// 游戏主组件
function Game() {
    return <GameContent />;
}

export default Game; 