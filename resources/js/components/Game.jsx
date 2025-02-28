import React, { useEffect, useState } from 'react';
import '../echo'; // 导入Echo配置
import { GameProvider, useGame } from '../context/GameContext.jsx';
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

// 游戏控制按钮组件
function GameControls({ onToggleHelp, onToggleCharacterInfo, onToggleInventory }) {
    return (
        <div className="game-controls">
            <button className="control-btn help-btn" onClick={onToggleHelp} title="帮助">
                <span>?</span>
            </button>
            <button className="control-btn character-btn" onClick={onToggleCharacterInfo} title="角色信息">
                <span>C</span>
            </button>
            <button className="control-btn inventory-btn" onClick={onToggleInventory} title="背包">
                <span>I</span>
            </button>
            <button className="control-btn map-btn" title="地图">
                <span>M</span>
            </button>
            <button className="control-btn settings-btn" title="设置">
                <span>⚙</span>
            </button>
        </div>
    );
}

// 侧边栏模态框组件
function SidebarModal({ title, isOpen, onClose, children }) {
    if (!isOpen) return null;
    
    return (
        <div className="sidebar-modal">
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
    const { loadGameData, isLoading } = useGame();
    const [showHelp, setShowHelp] = useState(false);
    const [showCharacterInfo, setShowCharacterInfo] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    
    // 检测屏幕方向
    useEffect(() => {
        const checkOrientation = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };
        
        // 初始检测
        checkOrientation();
        
        // 监听屏幕尺寸变化
        window.addEventListener('resize', checkOrientation);
        
        // 清理监听器
        return () => {
            window.removeEventListener('resize', checkOrientation);
        };
    }, []);
    
    // 加载游戏数据
    useEffect(() => {
        console.log('加载游戏数据');
        loadGameData();
    }, []);
    
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
    
    // 显示加载中状态
    if (isLoading) {
        return <div className="loading">加载游戏中...</div>;
    }
    
    return (
        <div className="game-layout">
            {/* 在横屏模式下隐藏侧边栏，在竖屏模式下显示 */}
            {(!isLandscape || (isLandscape && showCharacterInfo)) && (
                <div className={`vertical-sidebar ${isLandscape ? 'mobile-hidden' : ''}`}>
                    <CharacterInfo />
                </div>
            )}
            
            <div className="game-content">
                <div className="game-map-container">
                    <GameMap />
                    <GameControls 
                        onToggleHelp={toggleHelp} 
                        onToggleCharacterInfo={toggleCharacterInfo}
                        onToggleInventory={toggleInventory}
                    />
                </div>
                
                <div className="messages-container">
                    <MessageList />
                </div>
            </div>
            
            {/* 在横屏模式下隐藏背包，在竖屏模式下显示 */}
            {(!isLandscape || (isLandscape && showInventory)) && (
                <div className={`inventory-sidebar ${isLandscape ? 'mobile-hidden' : ''}`}>
                    <div className="inventory-section">
                        <h3>背包</h3>
                        <Inventory />
                    </div>
                </div>
            )}
            
            {/* 横屏模式下的角色信息模态框 */}
            {isLandscape && (
                <SidebarModal 
                    title="角色信息" 
                    isOpen={showCharacterInfo} 
                    onClose={toggleCharacterInfo}
                >
                    <CharacterInfo />
                </SidebarModal>
            )}
            
            {/* 横屏模式下的背包模态框 */}
            {isLandscape && (
                <SidebarModal 
                    title="背包" 
                    isOpen={showInventory} 
                    onClose={toggleInventory}
                >
                    <div className="inventory-section">
                        <Inventory />
                    </div>
                </SidebarModal>
            )}
            
            {showHelp && <div className="overlay">
                <GameHelp onClose={toggleHelp} />
            </div>}
        </div>
    );
}

// 游戏主组件
function Game() {
    return (
        <GameProvider>
            <GameContent />
        </GameProvider>
    );
}

export default Game; 