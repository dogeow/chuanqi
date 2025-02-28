import React from 'react';
import { useGame } from '../context/GameContext.jsx';

function CharacterInfo() {
    const { character } = useGame();
    
    // 如果角色未加载，不显示任何内容
    if (!character) return null;
    
    return (
        <div className="character-info">
            <h3>{character.name} Lv.{character.level}</h3>
            <div className="character-stats">
                <div className="stat">
                    <span>生命值:</span> 
                    <div className="progress-bar">
                        <div 
                            className="progress" 
                            style={{ width: `${(character.current_hp / character.max_hp) * 100}%` }}
                        ></div>
                        <span>{character.current_hp}/{character.max_hp}</span>
                    </div>
                </div>
                <div className="stat">
                    <span>经验值:</span> 
                    <div className="progress-bar">
                        <div 
                            className="progress" 
                            style={{ width: `${(character.exp / character.exp_to_level) * 100}%` }}
                        ></div>
                        <span>{character.exp}/{character.exp_to_level}</span>
                    </div>
                </div>
                <div className="stat">攻击力: {character.attack}</div>
                <div className="stat">防御力: {character.defense}</div>
                <div className="stat">金币: {character.gold}</div>
            </div>
        </div>
    );
}

export default CharacterInfo; 