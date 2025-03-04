import React, { useRef, useEffect, useState } from 'react';
import CollisionService from '../services/collisionService';
import useGameStore from '../store/gameStore';
import styled from '@emotion/styled';

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

const MiniMap = styled.div`
    position: fixed;
    left: 0px;
    top: 0px;
    width: 120px;
    height: 120px;
    background-color: rgba(0, 0, 0, 0.7);
    border: 2px solid #444;
    border-radius: 5px;
    z-index: 1000;
    overflow: hidden;
    cursor: pointer;
`;

// 添加传送点脉动动画样式
const teleportPulseStyle = `
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

function GameMap({ 
    mapData, 
    character, 
    monsters, 
    shops, 
    otherPlayers, 
    npcs, 
    teleportPoints, 
    mapMarkers, 
    onMove, 
    onMonsterClick, 
    onShopClick, 
    onNpcClick, 
    onTeleportClick 
}) {
    const gameMapRef = useRef(null);
    const playerRef = useRef(null);
    const viewportRef = useRef(null);
    const [mapSize, setMapSize] = useState({ width: 1000, height: 1000 });
    const [damageEffects, setDamageEffects] = useState([]);
    const [attackingMonsters, setAttackingMonsters] = useState({});
    const [zoomLevel, setZoomLevel] = useState(1);
    // 添加视口位置状态
    const [viewportPosition, setViewportPosition] = useState({ left: 0, top: 0 });
    
    // 使用gameStore中的碰撞状态和路径调整状态
    const collisions = useGameStore(state => state.collisions);
    const setCollisions = useGameStore(state => state.setCollisions);
    const pathAdjustment = useGameStore(state => state.pathAdjustment);
    const clearPathAdjustment = useGameStore(state => state.clearPathAdjustment);
    
    // 调试信息
    useEffect(() => {
        // 如果地图有自定义尺寸，则使用
        if (mapData && (mapData.width || mapData.height)) {
            setMapSize({
                width: mapData.width || 1000,
                height: mapData.height || 1000
            });
        }
    }, [mapData, monsters, npcs, teleportPoints, character, otherPlayers]);
    
    // 添加视口跟随玩家的逻辑
    useEffect(() => {
        if (!viewportRef.current || !character || !character.position_x || !character.position_y) return;
        
        // 计算视口中心位置
        const viewportWidth = viewportRef.current.clientWidth;
        const viewportHeight = viewportRef.current.clientHeight;
        
        // 计算视口应该滚动到的位置，使玩家保持在中心
        const scrollX = Math.max(0, character.position_x - (viewportWidth / 2));
        const scrollY = Math.max(0, character.position_y - (viewportHeight / 2));
        
        // 平滑滚动到玩家位置
        viewportRef.current.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: 'smooth'
        });
    }, [character?.position_x, character?.position_y]);
    
    // 监听怪物血量变化，显示伤害效果
    useEffect(() => {
        if (!monsters || monsters.length === 0) return;
        
        // 检测怪物血量变化
        monsters.forEach(monster => {
            if (monster.lastHp !== undefined && monster.lastHp !== monster.current_hp) {
                const damage = monster.lastHp - monster.current_hp;
                if (damage > 0) {
                    // 显示伤害效果
                    showDamageEffect(monster.id, damage, 'damage');
                    
                    // 标记怪物正在被攻击
                    setAttackingMonsters(prev => ({
                        ...prev,
                        [monster.id]: Date.now() + 1000 // 攻击效果持续1秒
                    }));
                } else if (damage < 0) {
                    // 显示治疗效果
                    showDamageEffect(monster.id, Math.abs(damage), 'heal');
                }
            }
            
            // 更新怪物上一次的血量
            monster.lastHp = monster.current_hp;
        });
    }, [monsters]);
    
    // 监听角色血量变化，显示伤害效果
    useEffect(() => {
        if (!character) return;
        
        if (character.lastHp !== undefined && character.lastHp !== character.current_hp) {
            const damage = character.lastHp - character.current_hp;
            if (damage > 0) {
                // 显示伤害效果
                showDamageEffect('player', damage, 'damage');
            } else if (damage < 0) {
                // 显示治疗效果
                showDamageEffect('player', Math.abs(damage), 'heal');
            }
        }
        
        // 更新角色上一次的血量
        character.lastHp = character.current_hp;
    }, [character?.current_hp]);
    
    // 添加碰撞检测逻辑
    useEffect(() => {
        if (!character || !monsters || !otherPlayers || !npcs) return;
        
        // 检测碰撞
        const monsterCollisions = CollisionService.checkPlayerMonsterCollisions(character, monsters);
        const playerCollisions = CollisionService.checkPlayerPlayerCollisions(character, otherPlayers);
        const npcCollisions = CollisionService.checkPlayerNpcCollisions(character, npcs);
        
        // 更新碰撞状态
        setCollisions({
            monsters: monsterCollisions,
            players: playerCollisions,
            npcs: npcCollisions
        });
        
        // 如果有碰撞，可以在控制台输出调试信息
        if (monsterCollisions.length > 0) {
            console.log('与怪物碰撞:', monsterCollisions);
        }
        
        if (playerCollisions.length > 0) {
            console.log('与其他玩家碰撞:', playerCollisions);
        }
        
        if (npcCollisions.length > 0) {
            console.log('与NPC碰撞:', npcCollisions);
        }
    }, [character?.position_x, character?.position_y, monsters, otherPlayers, npcs, setCollisions]);
    
    // 显示伤害/治疗效果
    const showDamageEffect = (targetId, amount, type) => {
        const newEffect = {
            id: Date.now() + Math.random(),
            targetId,
            amount,
            type,
            createdAt: Date.now(),
            emoji: type === 'damage' ? '💥' : '❤️'
        };
        
        setDamageEffects(prev => [...prev, newEffect]);
        
        // 2秒后移除效果
        setTimeout(() => {
            setDamageEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
        }, 2000);
    };
    
    // 处理地图点击事件
    function handleMapClick(e) {
        if (!gameMapRef.current || !viewportRef.current) return;
        
        // 获取视口和地图的位置信息
        const viewportRect = viewportRef.current.getBoundingClientRect();
        const mapRect = gameMapRef.current.getBoundingClientRect();
        
        // 获取视口的滚动位置
        const scrollLeft = viewportRef.current.scrollLeft;
        const scrollTop = viewportRef.current.scrollTop;
        
        // 计算点击位置相对于视口左上角的偏移
        const clickXRelativeToViewport = e.clientX - viewportRect.left;
        const clickYRelativeToViewport = e.clientY - viewportRect.top;
        
        // 计算实际地图上的位置 = 视口中的相对位置 + 滚动偏移
        const x = clickXRelativeToViewport + scrollLeft;
        const y = clickYRelativeToViewport + scrollTop;
        
        console.log('点击地图位置:', x, y, '滚动位置:', scrollLeft, scrollTop, '视口位置:', viewportRect.left, viewportRect.top);
        
        // 移动角色到点击位置
        onMove(x, y);
    }
    
    // 监听路径调整状态，设置自动清除定时器
    useEffect(() => {
        if (!pathAdjustment) return;
        
        // 3秒后清除路径调整效果
        const timer = setTimeout(() => {
            clearPathAdjustment();
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [pathAdjustment, clearPathAdjustment]);
    
    // 处理怪物点击，添加攻击效果
    function handleMonsterClick(monsterId) {
        // 标记怪物正在被攻击
        setAttackingMonsters(prev => ({
            ...prev,
            [monsterId]: Date.now() + 1000 // 攻击效果持续1秒
        }));
        
        // 调用原有的点击处理函数
        onMonsterClick(monsterId);
    }
    
    // 检查怪物是否正在被攻击
    const isMonsterBeingAttacked = (monsterId) => {
        return attackingMonsters[monsterId] && attackingMonsters[monsterId] > Date.now();
    };
    
    // 如果地图未加载，显示加载中
    if (!mapData) return <div className="loading">加载地图中...</div>;
    
    // 确定背景图片URL
    const backgroundUrl = mapData.background || '/images/default-map.jpg';
    
    // 处理缩放
    const handleZoom = (delta) => {
        setZoomLevel(prev => {
            const newZoom = Math.max(0.5, Math.min(2, prev + delta));
            return newZoom;
        });
    };

    // 添加恢复原始大小的处理函数
    const handleResetZoom = () => {
        setZoomLevel(1);
    };

    // 添加定位到玩家位置的处理函数
    const handleLocatePlayer = () => {
        if (!viewportRef.current || !character?.position_x || !character?.position_y) return;
        
        const viewportWidth = viewportRef.current.clientWidth;
        const viewportHeight = viewportRef.current.clientHeight;
        
        // 计算视口应该滚动到的位置，使玩家保持在中心
        const scrollX = Math.max(0, character.position_x - (viewportWidth / 2));
        const scrollY = Math.max(0, character.position_y - (viewportHeight / 2));
        
        // 平滑滚动到玩家位置
        viewportRef.current.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: 'smooth'
        });
    };

    // 添加视口滚动监听
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const handleScroll = () => {
            setViewportPosition({
                left: viewport.scrollLeft,
                top: viewport.scrollTop
            });
        };

        viewport.addEventListener('scroll', handleScroll);
        return () => viewport.removeEventListener('scroll', handleScroll);
    }, []);

    // 修改处理小地图点击的函数
    const handleMiniMapClick = (e) => {
        if (!gameMapRef.current || !viewportRef.current) return;
        
        const miniMap = e.currentTarget;
        const rect = miniMap.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * mapSize.width;
        const y = (e.clientY - rect.top) / rect.height * mapSize.height;
        
        // 移动视口到点击位置
        const newLeft = x - viewportRef.current.clientWidth / 2;
        const newTop = y - viewportRef.current.clientHeight / 2;
        
        viewportRef.current.scrollTo({
            left: newLeft,
            top: newTop,
            behavior: 'smooth'
        });

        // 立即更新视口位置状态
        setViewportPosition({
            left: newLeft,
            top: newTop
        });
    };

    return (
        <>
            <div 
                className="game-map-viewport" 
                ref={viewportRef}
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    overflow: 'auto',
                    position: 'relative'
                }}
            >
                <div 
                    className="game-map" 
                    ref={gameMapRef}
                    onClick={handleMapClick}
                    style={{ 
                        backgroundColor: '#111', 
                        position: 'relative', 
                        width: `${mapSize.width}px`, 
                        height: `${mapSize.height}px`,
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: '0 0',
                        transition: 'transform 0.3s ease'
                    }}
                >
                    
                     {/* 添加动画样式 */}
                     <style>{teleportPulseStyle}</style>

                    {/* 渲染地图背景 */}
                    <div 
                        className="map-background" 
                        style={{ 
                            backgroundImage: `url(${backgroundUrl})`,
                            backgroundColor: '#222',
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    ></div>
                    
                    {/* 显示路径调整效果 */}
                    {pathAdjustment && pathAdjustment.originalTarget && pathAdjustment.adjustedTarget && (
                        <>
                            {/* 原始目标位置标记 */}
                            <div 
                                className="original-target-marker"
                                style={{
                                    position: 'absolute',
                                    left: `${pathAdjustment.originalTarget.x}px`,
                                    top: `${pathAdjustment.originalTarget.y}px`,
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: 'rgba(255, 0, 0, 0.5)',
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 3,
                                    border: '2px solid red',
                                    boxShadow: '0 0 5px rgba(255, 0, 0, 0.7)',
                                    opacity: 0.7
                                }}
                            ></div>
                            
                            {/* 调整后的目标位置标记 */}
                            <div 
                                className="adjusted-target-marker"
                                style={{
                                    position: 'absolute',
                                    left: `${pathAdjustment.adjustedTarget.x}px`,
                                    top: `${pathAdjustment.adjustedTarget.y}px`,
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: 'rgba(0, 255, 0, 0.5)',
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 3,
                                    border: '2px solid green',
                                    boxShadow: '0 0 5px rgba(0, 255, 0, 0.7)',
                                    opacity: 0.7
                                }}
                            ></div>
                            
                            {/* 连接线 */}
                            <svg 
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    width: '100%',
                                    height: '100%',
                                    zIndex: 2,
                                    pointerEvents: 'none'
                                }}
                            >
                                <line 
                                    x1={pathAdjustment.originalTarget.x} 
                                    y1={pathAdjustment.originalTarget.y} 
                                    x2={pathAdjustment.adjustedTarget.x} 
                                    y2={pathAdjustment.adjustedTarget.y}
                                    style={{
                                        stroke: 'rgba(255, 255, 0, 0.7)',
                                        strokeWidth: 2,
                                        strokeDasharray: '5,5'
                                    }}
                                />
                            </svg>
                        </>
                    )}
                    
                    {/* 地图名称显示 */}
                    <div className="map-name" style={{ 
                        position: 'fixed', 
                        padding: '5px 10px', 
                        backgroundColor: 'rgba(0,0,0,0.7)', 
                        borderRadius: '5px',
                        zIndex: 15
                    }}>
                        {mapData.name || '未知地图'}
                    </div>
                    
                    {/* 渲染地图边界 */}
                    {mapData.boundaries && mapData.boundaries.map((boundary, index) => (
                        <div 
                            key={`boundary-${index}`}
                            className="map-boundary"
                            style={{
                                left: `${boundary.position_x || boundary.x}px`,
                                top: `${boundary.position_y || boundary.y}px`,
                                width: `${boundary.width}px`,
                                height: `${boundary.height}px`
                            }}
                        ></div>
                    ))}
                    
                    {/* 渲染地图标记 */}
                    {mapMarkers && mapMarkers.map((marker, index) => (
                        <div 
                            key={`marker-${index}`}
                            className={`map-marker ${marker.type}`}
                            style={{
                                left: `${marker.position_x || marker.x}px`,
                                top: `${marker.position_y || marker.y}px`
                            }}
                        >
                            {marker.type === 'quest' && '❗'}
                            {marker.type === 'point-of-interest' && '📌'}
                            {marker.type === 'danger' && '⚠️'}
                        </div>
                    ))}
                    
                    {/* 渲染传送点 */}
                    {teleportPoints && teleportPoints.length > 0 ? teleportPoints.map(point => (
                        <div 
                            key={`teleport-${point.id}`}
                            className="teleport-point"
                            style={{
                                left: `${point.x || 300}px`,
                                top: `${point.y || 300}px`,
                                backgroundColor: '#9966ff',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 4,
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0 0 15px rgba(153, 102, 255, 0.7)',
                                animation: 'pulse 2s infinite',
                                border: '2px solid #fff',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTeleportClick(point.target_map_id);
                            }}
                        >
                            <div className="teleport-map-name" style={{
                                position: 'absolute',
                                bottom: '-20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                zIndex: 5
                            }}>{point.target_map_name || point.name}</div>
                            {point.level_required && 
                                <div className="map-level-required" style={{
                                    position: 'absolute',
                                    top: '-20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    whiteSpace: 'nowrap'
                                }}>等级要求: {point.level_required}</div>
                            }
                            <span style={{ fontSize: '16px' }}>📍</span>
                        </div>
                    )) : null}
                    
                    {/* 渲染NPC */}
                    {npcs && npcs.length > 0 ? npcs.map(npc => (
                        <div 
                            key={`npc-${npc.id}`}
                            className={`npc ${npc.has_quest ? 'has-quest' : ''}`}
                            style={{
                                position: 'absolute',
                                left: `${npc.position_x || 400}px`,
                                top: `${npc.position_y || 400}px`,
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#ffcc00',
                                borderRadius: '50%',
                                zIndex: 6,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transform: 'translate(-50%, -50%)'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onNpcClick(npc.id);
                            }}
                        >
                            <div className="npc-name" style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                whiteSpace: 'nowrap',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                padding: '2px 5px',
                                borderRadius: '3px',
                                fontSize: '12px'
                            }}>{npc.name}</div>
                            
                            {/* NPC血条 - 始终显示 */}
                            <div className="npc-hp-bar-container" style={{
                                position: 'absolute',
                                bottom: '-15px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '40px',
                                height: '6px',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}>
                                <div 
                                    className="npc-hp-bar" 
                                    style={{
                                        width: `${npc?.current_hp && npc?.hp ? (npc.current_hp / npc.hp) * 100 : 100}%`,
                                        height: '100%',
                                        backgroundColor: '#ff3333',
                                        transition: 'width 0.3s ease-out'
                                    }}
                                ></div>
                            </div>
                            
                            {/* 显示血量数值 */}
                            <div className="npc-hp-text" style={{
                                position: 'absolute',
                                bottom: '-25px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '10px',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                padding: '1px 3px',
                                borderRadius: '2px'
                            }}>{npc?.current_hp || '?'}/{npc?.hp || '?'}</div>
                            
                            <div style={{ fontSize: '16px' }}>
                                {npc.emoji || '👨‍💼'}
                            </div>
                        </div>
                    )) : null}
                    
                    {/* 渲染玩家角色 */}
                    <div 
                        className="player" 
                        ref={playerRef}
                        style={{
                            position: 'absolute',
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#3366ff',
                            borderRadius: '50%',
                            zIndex: 10,
                            left: `${character?.position_x || 100}px`,
                            top: `${character?.position_y || 100}px`,
                            transform: 'translate(-50%, -50%)',
                            transition: 'left 0.2s ease-out, top 0.2s ease-out',
                            boxShadow: collisions.monsters.length > 0 || collisions.players.length > 0 ? 
                                '0 0 15px rgba(255, 0, 0, 0.7)' : 
                                '0 0 10px rgba(51, 102, 255, 0.7)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            animation: character?.lastHp !== character?.current_hp && character?.lastHp > character?.current_hp ? 'hpChange 0.5s' : 'none'
                        }}
                    >
                        <div className="player-level" style={{
                            position: 'absolute',
                            top: '-100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '10px',
                            whiteSpace: 'nowrap'
                        }}>Lv.{character?.level || 1}</div>
                        
                        {/* 玩家血条 - 始终显示 */}
                        <div className="player-hp-bar-container" style={{
                            position: 'absolute',
                            bottom: '-15px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '40px',
                            height: '6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div 
                                className="player-hp-bar" 
                                style={{
                                    width: `${character?.current_hp && character?.max_hp ? (character.current_hp / character.max_hp) * 100 : 100}%`,
                                    height: '100%',
                                    backgroundColor: '#ff3333',
                                    transition: 'width 0.3s ease-out',
                                    animation: character?.lastHp !== character?.current_hp ? 'hpChange 0.5s' : 'none'
                                }}
                            ></div>
                        </div>
                        
                        {/* 显示血量数值 */}
                        <div className="player-hp-text" style={{
                            position: 'absolute',
                            bottom: '-25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '10px',
                            padding: '1px 3px',
                        }}>{character?.current_hp || '???'}/{character?.max_hp || '?'}</div>
                        
                        {/* 玩家攻击状态 */}
                        {Object.keys(attackingMonsters).length > 0 && (
                            <div className="player-attack-indicator" style={{
                                position: 'absolute',
                                right: '-20px',
                                top: '0',
                                fontSize: '16px',
                                animation: 'attackPulse 0.5s infinite'
                            }}>
                                ⚔️
                            </div>
                        )}
                        
                        {/* 玩家表情 */}
                        <div style={{ fontSize: '16px' }}>
                            {character?.lastHp !== character?.current_hp && character?.lastHp > character?.current_hp ? '😣' : '😊'}
                        </div>
                        
                        {/* 碰撞指示器 */}
                        {(collisions.monsters.length > 0 || collisions.players.length > 0) && (
                            <div className="collision-indicator" style={{
                                position: 'absolute',
                                top: '-25px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(255, 0, 0, 0.7)',
                                color: 'white',
                                padding: '2px 5px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                whiteSpace: 'nowrap'
                            }}>
                                碰撞中!
                            </div>
                        )}
                    </div>
                    
                    {/* 渲染怪物 */}
                    {monsters && monsters.length > 0 ? monsters.filter(monster => !monster.is_dead && monster.current_hp > 0).map(monster => {
                        // 检查这个怪物是否与玩家碰撞
                        const isColliding = collisions.monsters.some(m => m.id === monster.id);
                        
                        return (
                            <div 
                                key={monster.id} 
                                className={`monster ${isColliding ? 'colliding' : ''}`}
                                data-monster-id={monster.id}
                                style={{ 
                                    position: 'absolute',
                                    left: `${monster.x || monster.position_x || 100}px`, 
                                    top: `${monster.y || monster.position_y || 100}px`,
                                    zIndex: 5,
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease-out',
                                    boxShadow: isColliding ? 
                                        '0 0 15px rgba(255, 0, 0, 0.7)' : 
                                        (isMonsterBeingAttacked(monster.id) ? '0 0 10px rgba(255, 0, 0, 0.7)' : 'none')
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMonsterClick(monster.id);
                                }}
                                title={`${monster.name} Lv.${monster.level || '?'} (点击攻击)`}
                            >
                                <div className="monster-name" style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    padding: '2px 5px',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div>{monster.name}</div>
                                    <div>Lv.{monster.level || '?'}</div>
                                </div>
                                
                                <div className="monster-hp-bar-container" style={{
                                    position: 'absolute',
                                    bottom: '-15px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '50px',
                                    height: '6px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div 
                                        className="monster-hp-bar" 
                                        style={{
                                            width: `${monster.hp_percentage || (monster?.current_hp && monster?.hp ? (monster.current_hp / monster.hp) * 100 : 100)}%`,
                                            height: '100%',
                                            backgroundColor: '#ff3333',
                                            transition: 'width 0.3s ease-out',
                                            animation: monster.lastHp !== monster.current_hp ? 'hpChange 0.5s' : 'none'
                                        }}
                                    ></div>
                                </div>
                                
                                <div className="monster-hp-text" style={{
                                    position: 'absolute',
                                    bottom: '-25px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '10px',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    padding: '1px 3px',
                                    borderRadius: '2px'
                                }}>{monster.current_hp || '?'}/{monster.hp || '?'}</div>
                                
                                <div 
                                    className="monster-emoji"
                                    style={{
                                        fontSize: '24px',
                                        transform: isColliding ? 'scale(1.2)' : 'scale(1)',
                                        transition: 'transform 0.2s ease-out',
                                        animation: isColliding ? 'attackPulse 0.5s infinite' : 'none'
                                    }}
                                >
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
                                </div>
                                
                                {/* 碰撞指示器 */}
                                {isColliding && (
                                    <div className="monster-collision-indicator" style={{
                                        position: 'absolute',
                                        top: '-25px',
                                        right: '-25px',
                                        backgroundColor: 'rgba(255, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '2px 5px',
                                        borderRadius: '3px',
                                        fontSize: '10px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        碰撞!
                                    </div>
                                )}
                            </div>
                        );
                    }) : <div style={{ position: 'absolute', top: '40px', left: '10px', color: 'white' }}>没有怪物</div>}
                    
                    {/* 渲染商店 */}
                    {shops && shops.length > 0 ? shops.map(shop => (
                        <div 
                            key={shop.id} 
                            className="shop" 
                            data-shop-id={shop.id}
                            style={{ 
                                position: 'absolute',
                                left: `${shop.x || shop.position_x || 200}px`, 
                                top: `${shop.y || shop.position_y || 200}px`,
                                width: '32px',
                                height: '32px',
                                backgroundColor: 'gold',
                                borderRadius: '5px',
                                zIndex: 5
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onShopClick(shop.id);
                            }}
                        >
                            <div className="shop-name" style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                whiteSpace: 'nowrap',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                padding: '2px 5px',
                                borderRadius: '3px',
                                fontSize: '12px'
                            }}>{shop.name}</div>
                        </div>
                    )) : null}
                    
                    {/* 渲染其他玩家 */}
                    {otherPlayers && otherPlayers.length > 0 ? otherPlayers.map(player => {
                        // 检查这个玩家是否与当前玩家碰撞
                        const isColliding = collisions.players.some(p => p.id === player.id);
                        
                        // 确保使用正确的位置属性
                        const playerX = player.position_x !== undefined ? player.position_x : (player.x || 150);
                        const playerY = player.position_y !== undefined ? player.position_y : (player.y || 150);
                        
                        return (
                            <div 
                                key={`player-${player.id}`}
                                className={`other-player ${isColliding ? 'colliding' : ''}`}
                                style={{
                                    position: 'absolute',
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: isColliding ? 'red' : 'green',
                                    borderRadius: '50%',
                                    zIndex: 8,
                                    left: `${playerX}px`,
                                    top: `${playerY}px`,
                                    transform: 'translate(-50%, -50%)',
                                    transition: 'left 0.3s ease-out, top 0.3s ease-out',
                                    boxShadow: isColliding ? '0 0 15px rgba(255, 0, 0, 0.7)' : 'none'
                                }}
                            >
                                <div className="player-name-container" style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    padding: '2px 5px',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div className="player-name">{player.name}</div>
                                    <div className="player-level">Lv.{player.level || 1}</div>
                                    <div className="player-position" style={{ fontSize: '10px', color: '#aaa' }}>
                                        ({Math.round(playerX)}, {Math.round(playerY)})
                                    </div>
                                </div>
                                
                                {/* 其他玩家血条 - 始终显示 */}
                                <div className="player-hp-bar-container" style={{
                                    position: 'absolute',
                                    bottom: '-15px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '40px',
                                    height: '6px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div 
                                        className="player-hp-bar" 
                                        style={{
                                            width: `${player?.current_hp && player?.max_hp ? (player.current_hp / player.max_hp) * 100 : 100}%`,
                                            height: '100%',
                                            backgroundColor: '#ff3333',
                                            transition: 'width 0.3s ease-out'
                                        }}
                                    ></div>
                                </div>
                                
                                {/* 显示血量数值 */}
                                <div className="player-hp-text" style={{
                                    position: 'absolute',
                                    bottom: '-25px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '10px',
                                    padding: '1px 3px',
                                }}>{player?.current_hp || '??'}/{player?.max_hp || '?'}</div>
                                
                                {/* 碰撞指示器 */}
                                {isColliding && (
                                    <div className="player-collision-indicator" style={{
                                        position: 'absolute',
                                        top: '-25px',
                                        right: '-25px',
                                        backgroundColor: 'rgba(255, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '2px 5px',
                                        borderRadius: '3px',
                                        fontSize: '10px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        碰撞!
                                    </div>
                                )}
                            </div>
                        );
                    }) : null}
                    
                    {/* 渲染伤害/治疗效果 */}
                    {damageEffects.map(effect => {
                        // 确定目标位置
                        let targetElement;
                        let targetX = 0;
                        let targetY = 0;
                        
                        if (effect.targetId === 'player') {
                            // 玩家位置
                            targetX = character?.position_x || 100;
                            targetY = character?.position_y || 100;
                        } else {
                            // 怪物位置
                            const monster = monsters.find(m => m.id === effect.targetId);
                            if (monster) {
                                targetX = monster.position_x || monster.x || 100;
                                targetY = monster.position_y || monster.y || 100;
                            }
                        }
                        
                        return (
                            <React.Fragment key={effect.id}>
                                {/* 伤害/治疗数值 */}
                                <div 
                                    style={{
                                        position: 'absolute',
                                        left: `${targetX}px`,
                                        top: `${targetY - 20}px`,
                                        color: effect.type === 'damage' ? '#ff3333' : '#33ff33',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        zIndex: 100,
                                        textShadow: '0 0 3px black',
                                        animation: 'damageFloat 2s forwards',
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    {effect.type === 'damage' ? '-' : '+'}{effect.amount}
                                </div>
                                
                                {/* 攻击表情符号 */}
                                <div 
                                    style={{
                                        position: 'absolute',
                                        left: `${targetX}px`,
                                        top: `${targetY}px`,
                                        fontSize: '24px',
                                        zIndex: 101,
                                        animation: 'attackEmoji 1s forwards',
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    {effect.emoji}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* 缩放控制器 */}
            <ZoomControls>
                <ZoomButton onClick={handleLocatePlayer} title="定位到玩家">👤</ZoomButton>
                <ZoomButton onClick={() => handleZoom(0.1)}>+</ZoomButton>
                <ZoomButton onClick={() => handleZoom(-0.1)}>-</ZoomButton>
                <ZoomButton onClick={handleResetZoom} title="恢复原始大小">⟲</ZoomButton>
            </ZoomControls>

            {/* 小地图 */}
            <MiniMap onClick={handleMiniMapClick}>
                {/* 玩家位置指示器 */}
                <div style={{
                    position: 'absolute',
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#3366ff',
                    borderRadius: '50%',
                    left: `${((character?.position_x || 0) / mapSize.width) * 100}%`,
                    top: `${((character?.position_y || 0) / mapSize.height) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2
                }} />

                {/* 视口范围指示器 - 使用 viewportPosition 状态 */}
                {viewportRef.current && (
                    <div style={{
                        position: 'absolute',
                        width: `${(viewportRef.current.clientWidth / mapSize.width) * 100}%`,
                        height: `${(viewportRef.current.clientHeight / mapSize.height) * 100}%`,
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        left: `${(viewportPosition.left / mapSize.width) * 100}%`,
                        top: `${(viewportPosition.top / mapSize.height) * 100}%`,
                        pointerEvents: 'none'
                    }} />
                )}

                {/* 怪物位置指示器 */}
                {monsters && monsters.map(monster => (
                    <div
                        key={`mini-monster-${monster.id}`}
                        style={{
                            position: 'absolute',
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#ff3366',
                            borderRadius: '50%',
                            left: `${((monster.position_x || monster.x) / mapSize.width) * 100}%`,
                            top: `${((monster.position_y || monster.y) / mapSize.height) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1
                        }}
                    />
                ))}
            </MiniMap>
        </>
    );
}

export default GameMap; 