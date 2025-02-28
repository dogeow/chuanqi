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
function GameControls({ onToggleHelp }) {
    return (
        <div className="game-controls">
            <button className="control-btn help-btn" onClick={onToggleHelp} title="帮助">
                <span>?</span>
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

// 游戏内容组件
function GameContent() {
    const { loadGameData, isLoading } = useGame();
    const [showHelp, setShowHelp] = useState(false);
    
    // 加载游戏数据
    useEffect(() => {
        console.log('加载游戏数据');
        loadGameData();
    }, []);
    
    // 切换帮助显示
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };
    
    // 显示加载中状态
    if (isLoading) {
        return <div className="loading">加载游戏中...</div>;
    }
    
    return (
        <div className="game-layout">
            <div className="vertical-sidebar">
                <CharacterInfo />
            </div>
            
            <div className="game-content">
                <div className="game-map-container">
                    <GameMap />
                    <GameControls onToggleHelp={toggleHelp} />
                </div>
                
                <div className="messages-container">
                    <MessageList />
                </div>
            </div>
            
            <div className="inventory-sidebar">
                <div className="inventory-section">
                    <h3>背包</h3>
                    <Inventory />
                </div>
            </div>
            
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