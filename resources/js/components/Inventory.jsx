import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext.jsx';

function Inventory() {
    const { character, inventory, useItem, equipItem, unequipItem, dropItem } = useGame();
    const [activeTooltip, setActiveTooltip] = useState(null);
    
    // 关闭物品提示框
    const closeTooltip = () => {
        setActiveTooltip(null);
    };
    
    // 点击物品外部区域时关闭提示框
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeTooltip && !e.target.closest('.item-tooltip') && !e.target.closest('.item')) {
                closeTooltip();
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [activeTooltip]);
    
    // 处理物品点击
    const handleItemClick = (item, e) => {
        e.stopPropagation();
        setActiveTooltip(item);
    };
    
    // 处理物品操作
    const handleItemAction = (action, itemId) => {
        switch (action) {
            case 'use':
                useItem(itemId);
                break;
            case 'equip':
                equipItem(itemId);
                break;
            case 'unequip':
                unequipItem(itemId);
                break;
            case 'drop':
                dropItem(itemId);
                break;
            default:
                console.error('未知操作:', action);
        }
        closeTooltip();
    };
    
    // 获取物品稀有度颜色类名
    const getRarityClass = (rarity) => {
        return `item-rarity-${rarity || 1}`;
    };
    
    // 获取物品属性HTML
    const getItemAttributesHTML = (item) => {
        if (!item) return '';
        
        let attributes = [];
        
        if (item.attack) attributes.push(`攻击力: +${item.attack}`);
        if (item.defense) attributes.push(`防御力: +${item.defense}`);
        if (item.hp) attributes.push(`生命值: +${item.hp}`);
        if (item.mp) attributes.push(`魔法值: +${item.mp}`);
        if (item.speed) attributes.push(`速度: +${item.speed}`);
        if (item.critical_chance) attributes.push(`暴击率: +${item.critical_chance}%`);
        if (item.dodge_chance) attributes.push(`闪避率: +${item.dodge_chance}%`);
        
        if (attributes.length === 0) return '无属性加成';
        
        return attributes.map(attr => `<div class="item-attribute item-bonus">${attr}</div>`).join('');
    };
    
    // 判断物品是否可装备
    const isEquippableItem = (item) => {
        return item && item.type && ['weapon', 'armor', 'accessory'].includes(item.type);
    };
    
    if (!inventory || inventory.length === 0) {
        return <div id="inventory-list" className="inventory-empty">背包为空</div>;
    }
    
    return (
        <div id="inventory-list">
            {inventory.map(item => (
                <div 
                    key={item.id} 
                    className="item" 
                    data-item-id={item.id}
                    onClick={(e) => handleItemClick(item, e)}
                >
                    <div className="item-icon">{item.item.image || '📦'}</div>
                    {item.quantity > 1 && <span className="item-badge">{item.quantity}</span>}
                    {item.is_equipped && <span className="item-equipped">已装备</span>}
                </div>
            ))}
            
            {activeTooltip && (
                <div className="item-tooltip" style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000
                }}>
                    <div className="item-tooltip-header">
                        <div className="item-tooltip-icon">
                            {activeTooltip.item.image || '📦'}
                        </div>
                        <div className="item-tooltip-title">
                            <div className={`item-tooltip-name ${getRarityClass(activeTooltip.item.rarity)}`}>
                                {activeTooltip.item.name}
                            </div>
                            <div className="item-tooltip-quantity">
                                数量: {activeTooltip.quantity}
                            </div>
                        </div>
                        <div className="tooltip-close" onClick={closeTooltip}>×</div>
                    </div>
                    
                    <div className="item-tooltip-description">
                        {activeTooltip.item.description || '无描述'}
                    </div>
                    
                    <div className="item-tooltip-attributes" 
                        dangerouslySetInnerHTML={{__html: getItemAttributesHTML(activeTooltip.item)}} 
                    />
                    
                    {activeTooltip.is_equipped && (
                        <div className="item-tooltip-equipped">已装备</div>
                    )}
                    
                    <div className="item-tooltip-actions">
                        {activeTooltip.item.is_consumable && (
                            <button 
                                className="item-action-btn use-btn"
                                onClick={() => handleItemAction('use', activeTooltip.id)}
                            >
                                使用
                            </button>
                        )}
                        
                        {isEquippableItem(activeTooltip.item) && (
                            <button 
                                className={`item-action-btn ${activeTooltip.is_equipped ? 'unequip-btn' : 'equip-btn'}`}
                                onClick={() => handleItemAction(
                                    activeTooltip.is_equipped ? 'unequip' : 'equip', 
                                    activeTooltip.id
                                )}
                            >
                                {activeTooltip.is_equipped ? '卸下' : '装备'}
                            </button>
                        )}
                        
                        <button 
                            className="item-action-btn drop-btn"
                            onClick={() => handleItemAction('drop', activeTooltip.id)}
                        >
                            丢弃
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Inventory; 