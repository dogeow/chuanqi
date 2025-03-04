import React from 'react';
import styled from '@emotion/styled';
import useGameStore from '../../store/gameStore';

// 共享样式组件
const HpBarContainer = styled.div`
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: ${props => props.width || '40px'};
    height: 6px;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 3px;
    overflow: hidden;
`;

const HpBar = styled.div`
    width: ${props => props.percentage}%;
    height: 100%;
    background-color: #ff3333;
    transition: width 0.3s ease-out;
    animation: ${props => props.isChanging ? 'hpChange 0.5s' : 'none'};
`;

const HpText = styled.div`
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    background-color: rgba(0,0,0,0.5);
    padding: 1px 3px;
    border-radius: 2px;
`;

const NameTag = styled.div`
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    background-color: rgba(0,0,0,0.7);
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 12px;
    text-align: center;
`;

const CollisionIndicator = styled.div`
    position: absolute;
    top: -25px;
    right: -25px;
    background-color: rgba(255, 0, 0, 0.7);
    color: white;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 10px;
    white-space: nowrap;
`;

// 玩家组件
const PlayerContainer = styled.div`
    position: absolute;
    width: 32px;
    height: 32px;
    background-color: #3366ff;
    border-radius: 50%;
    z-index: 10;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
    transform: translate(-50%, -50%);
    transition: left 0.2s ease-out, top 0.2s ease-out;
    box-shadow: ${props => props.isColliding ? 
        '0 0 15px rgba(255, 0, 0, 0.7)' : 
        '0 0 10px rgba(51, 102, 255, 0.7)'};
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 10px;
    font-weight: bold;
    animation: ${props => props.isHpChanging ? 'hpChange 0.5s' : 'none'};
`;

const PlayerLevel = styled.div`
    position: absolute;
    top: -100%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    white-space: nowrap;
`;

export const Player = ({ character }) => {
    const { collisions, isCollisionEnabled } = useGameStore();
    const isColliding = isCollisionEnabled && (collisions.monsters.length > 0 || collisions.players.length > 0);
    const isHpChanging = character?.lastHp !== character?.current_hp && character?.lastHp > character?.current_hp;

    return (
        <PlayerContainer
            x={character?.position_x || 100}
            y={character?.position_y || 100}
            isColliding={isColliding}
            isHpChanging={isHpChanging}
        >
            <PlayerLevel>Lv.{character?.level || 1}</PlayerLevel>
            
            <HpBarContainer>
                <HpBar 
                    percentage={character?.current_hp && character?.max_hp ? (character.current_hp / character.max_hp) * 100 : 100}
                    isChanging={isHpChanging}
                />
            </HpBarContainer>
            
            <HpText>
                {character?.current_hp || '???'}/{character?.max_hp || '?'}
            </HpText>
            
            <div style={{ fontSize: '16px' }}>
                {isHpChanging ? '😣' : '😊'}
            </div>
            
            {isColliding && isCollisionEnabled && <CollisionIndicator>碰撞中!</CollisionIndicator>}
        </PlayerContainer>
    );
};

// 怪物组件
const MonsterContainer = styled.div`
    position: absolute;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
    z-index: 5;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s ease-out;
    box-shadow: ${props => props.isColliding ? 
        '0 0 15px rgba(255, 0, 0, 0.7)' : 
        (props.isBeingAttacked ? '0 0 10px rgba(255, 0, 0, 0.7)' : 'none')};
`;

const MonsterEmoji = styled.div`
    font-size: 24px;
    transform: ${props => props.isColliding ? 'scale(1.2)' : 'scale(1)'};
    transition: transform 0.2s ease-out;
    animation: ${props => props.isColliding ? 'attackPulse 0.5s infinite' : 'none'};
`;

export const Monster = ({ monster, isBeingAttacked, onClick }) => {
    const { collisions, isCollisionEnabled } = useGameStore();
    const isColliding = isCollisionEnabled && collisions.monsters.some(m => m.id === monster.id);

    const handleClick = (e) => {
        // 阻止事件冒泡和默认行为
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        
        // 调用点击回调
        onClick(monster.id);
    };

    return (
        <MonsterContainer
            x={monster.x || monster.position_x || 100}
            y={monster.y || monster.position_y || 100}
            isColliding={isColliding}
            isBeingAttacked={isBeingAttacked}
            onClick={handleClick}
            onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                e.nativeEvent.stopImmediatePropagation();
            }}
            onMouseUp={(e) => {
                e.stopPropagation();
                e.preventDefault();
                e.nativeEvent.stopImmediatePropagation();
            }}
            className="monster"
            title={`${monster.name} Lv.${monster.level || '?'} (点击攻击)`}
            data-monster-id={monster.id}
        >
            <NameTag>
                <div>{monster.name}</div>
                <div>Lv.{monster.level || '?'}</div>
            </NameTag>
            
            <HpBarContainer width="50px">
                <HpBar 
                    percentage={monster.hp_percentage || (monster?.current_hp && monster?.hp ? (monster.current_hp / monster.hp) * 100 : 100)}
                    isChanging={monster.lastHp !== monster.current_hp}
                />
            </HpBarContainer>
            
            <HpText>
                {monster.current_hp || '?'}/{monster.hp || '?'}
            </HpText>
            
            <MonsterEmoji isColliding={isColliding}>
                {monster.emoji || '👾'}
                {isColliding && (
                    <span style={{ 
                        position: 'absolute', 
                        top: '-10px', 
                        right: '-10px', 
                        fontSize: '16px',
                        animation: 'attackPulse 0.3s infinite'
                    }}>💥</span>
                )}
            </MonsterEmoji>
            
            {isColliding && isCollisionEnabled && <CollisionIndicator>碰撞!</CollisionIndicator>}
        </MonsterContainer>
    );
};

// 传送点组件
const TeleportPointContainer = styled.div`
    position: absolute;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
    background-color: #9966ff;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 4;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 0 15px rgba(153, 102, 255, 0.7);
    animation: pulse 2s infinite;
    border: 2px solid #fff;
`;

const TeleportMapName = styled.div`
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    text-align: center;
    z-index: 5;
`;

const LevelRequired = styled.div`
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
`;

export const TeleportPoint = ({ point, onTeleportClick }) => {
    return (
        <TeleportPointContainer
            x={point.x || 300}
            y={point.y || 300}
            onClick={(e) => {
                e.stopPropagation();
                // 传递目标地图ID和当前传送点的位置信息
                onTeleportClick(point.target_map_id, {
                    x: point.x || 300,
                    y: point.y || 300
                });
            }}
        >
            <TeleportMapName>
                {point.target_map_name || point.name}
            </TeleportMapName>
            {point.level_required && (
                <LevelRequired>
                    等级要求: {point.level_required}
                </LevelRequired>
            )}
            <span style={{ fontSize: '16px' }}>📍</span>
        </TeleportPointContainer>
    );
};

const ShopContainer = styled.div`
    position: absolute;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
    width: 32px;
    height: 32px;
    transform: translate(-50%, -50%);
    z-index: 4;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    transition: transform 0.2s ease;

    &:hover {
        transform: translate(-50%, -50%) scale(1.1);
    }

    &:active {
        transform: translate(-50%, -50%) scale(0.9);
    }
`;

const ShopName = styled.div`
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    text-align: center;
    z-index: 5;
`;

export const Shop = ({ shop, onShopClick }) => {
    return (
        <ShopContainer
            x={shop.x || shop.position_x || 0}
            y={shop.y || shop.position_y || 0}
            onClick={(e) => {
                e.stopPropagation();
                onShopClick(shop.id);
            }}
            className="shop"
            title={`${shop.name} (点击交易)`}
        >
            <span>🏪</span>
            <ShopName>{shop.name}</ShopName>
        </ShopContainer>
    );
}; 