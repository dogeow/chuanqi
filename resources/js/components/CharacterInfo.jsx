import React, { useState } from 'react';
import useGameStore from '../store/gameStore';

function CharacterInfo({ character }) {
    const { inventory } = useGameStore();
    
    // 如果角色未加载，不显示任何内容
    if (!character) return null;
    
    // 计算HP百分比
    const hpPercentage = character.max_hp ? Math.floor((character.current_hp / character.max_hp) * 100) : 0;
    
    // 计算经验百分比
    const expPercentage = character.exp_to_level ? Math.floor((character.exp / character.exp_to_level) * 100) : 0;
    
    // 计算魔法值百分比
    const mpPercentage = character.max_mp ? Math.floor((character.current_mp / character.max_mp) * 100) : 0;
    
    // 获取已装备的物品
    const equippedItems = inventory ? inventory.filter(item => item.is_equipped) : [];
    
    return (
        <div className="character-info">
            <div className="character-header">
                <h3 className="character-name">
                    <span className="character-level">Lv.{character.level}</span> {character.name}
                </h3>
            </div>
            
            <div className="character-stats">
                <div className="stat hp-stat">
                    <span>生命值:</span> 
                    <div className="progress-bar">
                        <div 
                            className="progress hp-progress" 
                            style={{ width: `${hpPercentage}%` }}
                        ></div>
                        <span>{character.current_hp}/{character.max_hp} ({hpPercentage}%)</span>
                    </div>
                </div>
                
                {character.max_mp > 0 && (
                    <div className="stat mp-stat">
                        <span>魔法值:</span> 
                        <div className="progress-bar">
                            <div 
                                className="progress mp-progress" 
                                style={{ width: `${mpPercentage}%` }}
                            ></div>
                            <span>{character.current_mp}/{character.max_mp} ({mpPercentage}%)</span>
                        </div>
                    </div>
                )}
                
                <div className="stat exp-stat">
                    <span>经验值:</span> 
                    <div className="progress-bar">
                        <div 
                            className="progress exp-progress" 
                            style={{ width: `${expPercentage}%` }}
                        ></div>
                        <span>{character.exp}/{character.exp_to_level} ({expPercentage}%)</span>
                    </div>
                </div>
                
                <div className="basic-stats">
                    <div className="stat">
                        <span className="stat-label">攻击力:</span> 
                        <span className="stat-value">{character.attack}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">防御力:</span> 
                        <span className="stat-value">{character.defense}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">金币:</span> 
                        <span className="stat-value">{character.gold || 0}</span>
                    </div>
                </div>
                
                {/* 显示已装备的物品 */}
                {equippedItems.length > 0 && (
                    <div className="equipped-items">
                        <h4>已装备物品</h4>
                        <div className="equipped-items-list">
                            {equippedItems.map(inventoryItem => (
                                <div key={inventoryItem.id} className="equipped-item">
                                    <div className="equipped-item-icon">
                                        {inventoryItem.item.image || '📦'}
                                    </div>
                                    <div className="equipped-item-info">
                                        <div className="equipped-item-name">{inventoryItem.item.name}</div>
                                        <div className="equipped-item-type">{inventoryItem.item.type}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CharacterInfo; 