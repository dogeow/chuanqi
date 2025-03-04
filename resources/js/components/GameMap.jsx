import React, { useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import useGameStore from '../store/gameStore';
import MapViewport from './map/MapViewport';
import MapControls from './map/MapControls';
import MiniMap from './map/MiniMap';
import { Player, Monster, TeleportPoint } from './map/MapEntities';

// 添加动画keyframes
const animations = `
    @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; box-shadow: 0 0 15px rgba(153, 102, 255, 0.7); }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; box-shadow: 0 0 20px rgba(153, 102, 255, 0.9); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; box-shadow: 0 0 15px rgba(153, 102, 255, 0.7); }
    }

    @keyframes damageFloat {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-30px); opacity: 0; }
    }

    @keyframes attackPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }

    @keyframes hpChange {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    @keyframes attackEmoji {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        50% { transform: translateY(-15px) scale(1.2); opacity: 1; }
        100% { transform: translateY(-30px) scale(1); opacity: 0; }
    }
`;

const GameMapViewport = styled.div`
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
`;

const GameMapContainer = styled.div`
    background-color: #111;
    position: relative;
    width: ${props => props.width}px;
    height: ${props => props.height}px;
    transform: scale(${props => props.zoomLevel});
    transform-origin: 0 0;
    transition: transform 0.3s ease;
`;

const MapBackground = styled.div`
    background-image: url(${props => props.backgroundUrl});
    background-color: #222;
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
`;

const MapName = styled.div`
    position: fixed;
    padding: 5px 10px;
    background-color: rgba(0,0,0,0.7);
    border-radius: 5px;
    z-index: 15;
`;

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

// 添加缩放控制器样式
const ZoomControls = styled.div`
    position: fixed;
    top: 6px;
    right: 6px;
    display: flex;
    gap: 10px;
    z-index: 1000;
`;

const ZoomButton = styled.button`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    border: 2px solid #444;
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(0, 0, 0, 0.9);
        border-color: #666;
        transform: scale(1.1);
    }
`;

function GameMap({ 
    mapData, 
    onMove, 
    onMonsterClick, 
    onShopClick, 
    onNpcClick, 
    onTeleportClick 
}) {
    const viewportRef = useRef(null);
    const { 
        character,
        monsters,
        teleportPoints,
        damageEffects,
        attackingMonsters,
        setMapSize,
        addDamageEffect,
        removeDamageEffect,
        setAttackingMonsters
    } = useGameStore();

    // 更新地图尺寸
    useEffect(() => {
        if (mapData && (mapData.width || mapData.height)) {
            setMapSize({
                width: mapData.width || 1000,
                height: mapData.height || 1000
            });
        }
    }, [mapData, setMapSize]);

    // 处理怪物点击
    const handleMonsterClick = (monsterId) => {
        setAttackingMonsters(prev => ({
            ...prev,
            [monsterId]: Date.now() + 1000
        }));
        onMonsterClick(monsterId);
    };

    // 显示伤害效果
    const showDamageEffect = (targetId, amount, type) => {
        const newEffect = {
            id: Date.now() + Math.random(),
            targetId,
            amount,
            type,
            createdAt: Date.now(),
            emoji: type === 'damage' ? '💥' : '❤️'
        };
        
        addDamageEffect(newEffect);
        
        setTimeout(() => {
            removeDamageEffect(newEffect.id);
        }, 2000);
    };

    // 定位到玩家位置
    const handleLocatePlayer = () => {
        if (!viewportRef.current || !character?.position_x || !character?.position_y) return;
        
        const viewportWidth = viewportRef.current.clientWidth;
        const viewportHeight = viewportRef.current.clientHeight;
        
        const scrollX = Math.max(0, character.position_x - (viewportWidth / 2));
        const scrollY = Math.max(0, character.position_y - (viewportHeight / 2));
        
        viewportRef.current.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: 'smooth'
        });
    };

    // 处理小地图点击
    const handleMiniMapClick = (x, y) => {
        if (!viewportRef.current) return;
        
        const newLeft = x - viewportRef.current.clientWidth / 2;
        const newTop = y - viewportRef.current.clientHeight / 2;
        
        viewportRef.current.scrollTo({
            left: newLeft,
            top: newTop,
            behavior: 'smooth'
        });
    };

    if (!mapData) return <div className="loading">加载地图中...</div>;

    return (
        <>
            <style>{animations}</style>
            <MapViewport 
                ref={viewportRef}
                mapData={mapData}
                onMapClick={onMove}
            >
                {/* 传送点 */}
                {teleportPoints?.map(point => (
                    <TeleportPoint
                        key={`teleport-${point.id}`}
                        point={point}
                        onTeleportClick={onTeleportClick}
                    />
                ))}

                {/* 玩家角色 */}
                <Player character={character} />

                {/* 怪物 */}
                {monsters?.filter(monster => !monster.is_dead && monster.current_hp > 0).map(monster => (
                    <Monster
                        key={monster.id}
                        monster={monster}
                        isBeingAttacked={attackingMonsters[monster.id] > Date.now()}
                        onClick={handleMonsterClick}
                    />
                ))}

                {/* 伤害效果 */}
                {damageEffects.map(effect => {
                    const targetX = effect.targetId === 'player' ? 
                        (character?.position_x || 100) : 
                        (monsters.find(m => m.id === effect.targetId)?.position_x || 100);
                    
                    const targetY = effect.targetId === 'player' ? 
                        (character?.position_y || 100) : 
                        (monsters.find(m => m.id === effect.targetId)?.position_y || 100);

                    return (
                        <React.Fragment key={effect.id}>
                            <DamageEffect
                                x={targetX}
                                y={targetY}
                                type={effect.type}
                            >
                                {effect.type === 'damage' ? '-' : '+'}{effect.amount}
                            </DamageEffect>
                            
                            <AttackEmoji
                                x={targetX}
                                y={targetY}
                            >
                                {effect.emoji}
                            </AttackEmoji>
                        </React.Fragment>
                    );
                })}
            </MapViewport>

            <MapControls onLocatePlayer={handleLocatePlayer} />
            <MiniMap 
                viewportRef={viewportRef}
                onMiniMapClick={handleMiniMapClick}
            />
        </>
    );
}

export default GameMap; 