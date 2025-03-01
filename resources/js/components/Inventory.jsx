import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';

function Inventory({ items, onUseItem, onEquipItem, onUnequipItem, onDropItem }) {
    const { character } = useGameStore();
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef(null);
    
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
        
        // 计算提示框位置
        const rect = e.currentTarget.getBoundingClientRect();
        const position = {
            left: rect.right + 10, // 在物品右侧显示
            top: rect.top
        };
        
        // 检查是否会超出屏幕右侧
        if (position.left + 250 > window.innerWidth) { // 假设提示框宽度为250px
            position.left = rect.left - 260; // 在物品左侧显示
        }
        
        // 检查是否会超出屏幕底部
        if (tooltipRef.current) {
            const tooltipHeight = tooltipRef.current.offsetHeight;
            if (position.top + tooltipHeight > window.innerHeight) {
                position.top = window.innerHeight - tooltipHeight - 10;
            }
        }
        
        setTooltipPosition(position);
        setActiveTooltip(item);
    };
    
    // 处理物品操作
    const handleItemAction = (action, itemId) => {
        closeTooltip();
        
        switch (action) {
            case 'use':
                onUseItem(itemId);
                break;
            case 'equip':
                onEquipItem(itemId);
                break;
            case 'unequip':
                onUnequipItem(itemId);
                break;
            case 'drop':
                onDropItem(itemId);
                break;
            default:
                break;
        }
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
    
    // 判断角色是否可以装备该物品
    const canEquipItem = (item) => {
        if (!isEquippableItem(item)) return false;
        
        // 这里可以添加更多的装备条件判断，比如等级要求、职业要求等
        // 例如：if (character.level < item.level_required) return false;
        
        return true;
    };
    
    return (
        <div className="inventory">
            <div className="inventory-grid">
                {items && items.length > 0 ? (
                    items.map(item => (
                        <div 
                            key={item.id} 
                            className="item" 
                            data-item-id={item.id}
                            onClick={(e) => handleItemClick(item, e)}
                        >
                            <div className="item-icon">
                                {item && item.item && item.item.image ? 
                                    (() => {
                                        const emojis = Array.from(item.item.image);
                                        if (emojis.length >= 2) {
                                            return (
                                                <span style={{ position: 'relative' }}>
                                                    <span style={{ 
                                                        position: 'absolute', 
                                                        top: '0', 
                                                        left: '0', 
                                                        fontSize: '24px', 
                                                        opacity: '0.3', 
                                                        zIndex: 1 
                                                    }}>
                                                        {emojis[1]}
                                                    </span>
                                                    <span style={{ position: 'relative', zIndex: 2 }}>
                                                        {emojis[0]}
                                                    </span>
                                                </span>
                                            );
                                        } else {
                                            return item.item.image;
                                        }
                                    })() 
                                    : '📦'}
                            </div>
                            {item.quantity > 1 && <span className="item-badge">{item.quantity}</span>}
                            {item.is_equipped && <span className="item-equipped">已装备</span>}
                            {!item.is_equipped && item.item && isEquippableItem(item.item) && 
                                <span className={`item-equippable ${canEquipItem(item.item) ? 'can-equip' : 'cannot-equip'}`}>
                                    {canEquipItem(item.item) ? '可装备' : '不可装备'}
                                </span>
                            }
                        </div>
                    ))
                ) : (
                    <div className="empty-inventory">背包是空的</div>
                )}
            </div>
            
            {activeTooltip && (
                <div 
                    ref={tooltipRef}
                    className="item-tooltip" 
                    style={{
                        position: 'fixed',
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        zIndex: 1000
                    }}
                >
                    <div className="item-tooltip-header">
                        <div className="item-tooltip-icon">
                            {activeTooltip.item && activeTooltip.item.image ? 
                                (() => {
                                    const emojis = Array.from(activeTooltip.item.image);
                                    if (emojis.length >= 2) {
                                        return (
                                            <span style={{ position: 'relative' }}>
                                                <span style={{ 
                                                    position: 'absolute', 
                                                    top: '0', 
                                                    left: '0', 
                                                    fontSize: '24px', 
                                                    opacity: '0.3', 
                                                    zIndex: 1 
                                                }}>
                                                    {emojis[1]}
                                                </span>
                                                <span style={{ position: 'relative', zIndex: 2 }}>
                                                    {emojis[0]}
                                                </span>
                                            </span>
                                        );
                                    } else {
                                        return activeTooltip.item.image;
                                    }
                                })() 
                                : '📦'}
                        </div>
                        <div className="item-tooltip-title">
                            <div className={`item-tooltip-name ${getRarityClass(activeTooltip.item && activeTooltip.item.rarity)}`}>
                                {activeTooltip.item ? activeTooltip.item.name : '未知物品'}
                            </div>
                            <div className="item-tooltip-quantity">
                                数量: {activeTooltip.quantity || 0}
                            </div>
                        </div>
                        <div className="tooltip-close" onClick={closeTooltip}>×</div>
                    </div>
                    
                    <div className="item-tooltip-description">
                        {activeTooltip.item && activeTooltip.item.description ? activeTooltip.item.description : '无描述'}
                    </div>
                    
                    <div className="item-tooltip-attributes" 
                        dangerouslySetInnerHTML={{__html: getItemAttributesHTML(activeTooltip.item)}} 
                    />
                    
                    {activeTooltip.is_equipped && (
                        <div className="item-tooltip-equipped">已装备</div>
                    )}
                    
                    {!activeTooltip.is_equipped && activeTooltip.item && isEquippableItem(activeTooltip.item) && (
                        <div className={`item-tooltip-equippable ${canEquipItem(activeTooltip.item) ? 'can-equip' : 'cannot-equip'}`}>
                            {canEquipItem(activeTooltip.item) ? '可装备此物品' : '不满足装备条件'}
                        </div>
                    )}
                    
                    <div className="item-tooltip-actions">
                        {activeTooltip.item && activeTooltip.item.is_consumable && (
                            <button 
                                className="item-action-btn use-btn"
                                onClick={() => handleItemAction('use', activeTooltip.id)}
                            >
                                使用
                            </button>
                        )}
                        
                        {activeTooltip.item && isEquippableItem(activeTooltip.item) && (
                            <button 
                                className={`item-action-btn ${activeTooltip.is_equipped ? 'unequip-btn' : 'equip-btn'}`}
                                onClick={() => handleItemAction(
                                    activeTooltip.is_equipped ? 'unequip' : 'equip', 
                                    activeTooltip.id
                                )}
                                disabled={!activeTooltip.is_equipped && !canEquipItem(activeTooltip.item)}
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