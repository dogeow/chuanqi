import React, { useMemo } from 'react';
import useGameStore from '../store/gameStore';

// 进度条组件
const ProgressBar = ({ current, max, label, className }) => {
    const percentage = max ? Math.floor((current / max) * 100) : 0;
    
    return (
        <div className={`stat ${className}-stat`}>
            <span>{label}：</span> 
            <div className="progress-bar">
                <div 
                    className={`progress ${className}-progress`} 
                    style={{ width: `${percentage}%` }}
                ></div>
                <span>{current}/{max} ({percentage}%)</span>
            </div>
        </div>
    );
};

// 基础属性组件
const StatItem = ({ label, value, defaultValue = 0 }) => (
    <div className="stat">
        <span className="stat-label">{label}：</span> 
        <span className="stat-value">{value ?? defaultValue}</span>
    </div>
);

// 装备物品组件
const EquippedItemsList = ({ items }) => {
    if (!items || items.length === 0) return null;
    
    return (
        <div className="equipped-items">
            <h4>已装备物品</h4>
            <div className="equipped-items-list">
                {items.map(inventoryItem => (
                    <div key={inventoryItem.id} className="equipped-item">
                        <div className="equipped-item-icon">
                            {inventoryItem.item.image || '📦'}
                        </div>
                        <div className="equipped-item-info">
                            <div className="equipped-item-name">{inventoryItem.item.name}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

function CharacterInfo({ character }) {
    const { inventory } = useGameStore();
    
    // 如果角色未加载，不显示任何内容
    if (!character) return null;
    
    // 使用 useMemo 缓存已装备物品列表，避免不必要的重新计算
    const equippedItems = useMemo(() => {
        return inventory ? inventory.filter(item => item.is_equipped) : [];
    }, [inventory]);
    
    return (
        <div className="character-info">
            <div className="character-header">
                <h3 className="character-name">
                    <span className="character-level">Lv.{character.level}</span> {character.name}
                </h3>
            </div>
            
            <div className="character-stats">
                <ProgressBar 
                    current={character.current_hp} 
                    max={character.max_hp} 
                    label="生命值" 
                    className="hp" 
                />
                
                {character.max_mp > 0 && (
                    <ProgressBar 
                        current={character.current_mp} 
                        max={character.max_mp} 
                        label="魔法值" 
                        className="mp" 
                    />
                )}

                <div>经验值：{character.exp}</div>
                
                <div className="basic-stats">
                    <StatItem label="攻击力" value={character.attack} />
                    <StatItem label="防御力" value={character.defense} />
                    <StatItem label="金币" value={character.gold} defaultValue={0} />
                </div>
                
                <EquippedItemsList items={equippedItems} />
            </div>
        </div>
    );
}

export default CharacterInfo; 