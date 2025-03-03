import React from 'react';
import axios from 'axios';

/**
 * 系统菜单组件
 */
function SystemMenu() {
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
        { id: 'settings', label: '游戏设置', icon: '⚙️', onClick: () => alert('游戏设置功能尚未实现') },
        { id: 'help', label: '游戏帮助', icon: '❓', onClick: () => alert('游戏帮助功能尚未实现') },
        { id: 'about', label: '关于游戏', icon: 'ℹ️', onClick: () => alert('关于游戏功能尚未实现') },
        { id: 'logout', label: '退出登录', icon: '🚪', onClick: handleLogout }
    ];
    
    return (
        <div className="system-menu">
            <h3 className="system-menu-title">系统菜单</h3>
            
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