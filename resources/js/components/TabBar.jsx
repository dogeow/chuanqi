import React from 'react';

/**
 * 底部标签栏组件
 * @param {Object} props 组件属性
 * @param {string} props.activeTab 当前激活的标签
 * @param {Function} props.onTabChange 标签切换回调函数
 */
function TabBar({ activeTab, onTabChange }) {
    // 定义标签项
    const tabs = [
        { id: 'character', label: '角色', icon: '👤' },
        { id: 'inventory', label: '背包', icon: '🎒' },
        { id: 'messages', label: '消息', icon: '📜' },
        { id: 'chat', label: '聊天', icon: '💬' },
        { id: 'system', label: '系统', icon: '⚙️' }
    ];
    
    return (
        <div className="tab-bar">
            {tabs.map(tab => (
                <div 
                    key={tab.id}
                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <div className="tab-icon">{tab.icon}</div>
                    <div className="tab-label">{tab.label}</div>
                </div>
            ))}
        </div>
    );
}

export default TabBar; 