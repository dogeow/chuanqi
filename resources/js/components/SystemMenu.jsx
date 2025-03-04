import React, { useState } from 'react';
import axios from 'axios';
import Rankings from './Rankings';

/**
 * 系统菜单组件
 */
function SystemMenu() {
    // 添加一个状态来控制是否显示排行榜
    const [showRankings, setShowRankings] = useState(false);
    
    // 退出登录
    const handleLogout = async () => {
        try {
            await axios.post('/logout');
            // 使用普通的重定向方式，而不是 react-router-dom 的 navigate
            window.location.href = '/login';
        } catch (error) {
            console.error('退出登录失败:', error);
            alert('退出登录失败，请重试');
        }
    };
    
    // 系统菜单项
    const menuItems = [
        { id: 'rankings', label: '排行榜', icon: '🏆', onClick: () => setShowRankings(true) },
        { id: 'settings', label: '游戏设置', icon: '⚙️', onClick: () => alert('游戏设置功能尚未实现') },
        { id: 'help', label: '游戏帮助', icon: '❓', onClick: () => alert('游戏帮助功能尚未实现') },
        { id: 'about', label: '关于游戏', icon: 'ℹ️', onClick: () => alert('关于游戏功能尚未实现') },
        { id: 'logout', label: '退出登录', icon: '🚪', onClick: handleLogout }
    ];
    
    // 关闭排行榜
    const handleCloseRankings = () => {
        setShowRankings(false);
    };
    
    // 如果显示排行榜，则渲染排行榜组件
    if (showRankings) {
        return (
            <div className="rankings-page">
                <button className="back-button" onClick={handleCloseRankings}>返回</button>
                <Rankings />
            </div>
        );
    }

     // 更精确地检测移动设备
     const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
     (window.innerWidth < 768);
    
    return (
        <div className="system-menu">
            {!isMobileDevice && <h3 className="system-menu-title">系统菜单</h3>}
            
            <div className="menu-items">
                {menuItems.map(item => (
                    <div 
                        key={item.id} 
                        className="menu-item"
                        onClick={item.onClick}
                    >
                        <div className="menu-item-icon">{item.icon}</div>
                        <div className="menu-item-label">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SystemMenu;