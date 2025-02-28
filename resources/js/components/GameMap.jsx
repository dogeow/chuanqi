import React, { useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext.jsx';

function GameMap() {
    const { 
        currentMap, 
        monsters, 
        shops, 
        otherPlayers,
        npcs,
        teleportPoints,
        mapMarkers,
        handleMonsterClick, 
        handleShopClick,
        handleNpcClick,
        handleTeleportClick,
        moveCharacter
    } = useGame();
    
    const gameMapRef = useRef(null);
    const playerRef = useRef(null);
    
    // 调试信息
    useEffect(() => {
        console.log('地图数据:', currentMap);
        console.log('怪物数据:', monsters);
        console.log('NPC数据:', npcs);
        console.log('传送点数据:', teleportPoints);
    }, [currentMap, monsters, npcs, teleportPoints]);
    
    // 处理地图点击事件
    function handleMapClick(e) {
        if (!gameMapRef.current) return;
        
        // 获取点击位置相对于地图的坐标
        const rect = gameMapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('点击地图位置:', x, y);
        
        // 移动角色到点击位置
        moveCharacter(x, y);
    }
    
    // 如果地图未加载，显示加载中
    if (!currentMap) return <div className="loading">加载地图中...</div>;
    
    // 确定背景图片URL
    const backgroundUrl = currentMap.background || '/images/default-map.jpg';
    
    return (
        <div 
            className="game-map" 
            ref={gameMapRef}
            onClick={handleMapClick}
            style={{ backgroundColor: '#111', position: 'relative', width: '100%', height: '100%' }}
        >
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
            
            {/* 地图名称显示 */}
            <div className="map-name" style={{ 
                position: 'absolute', 
                top: '10px', 
                left: '10px', 
                padding: '5px 10px', 
                backgroundColor: 'rgba(0,0,0,0.7)', 
                borderRadius: '5px',
                zIndex: 5
            }}>
                {currentMap.name || '未知地图'}
            </div>
            
            {/* 渲染地图边界 */}
            {currentMap.boundaries && currentMap.boundaries.map((boundary, index) => (
                <div 
                    key={`boundary-${index}`}
                    className="map-boundary"
                    style={{
                        left: `${boundary.x}px`,
                        top: `${boundary.y}px`,
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
                        left: `${marker.x}px`,
                        top: `${marker.y}px`
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
                        top: `${point.y || 300}px`
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTeleportClick(point.id);
                    }}
                >
                    <div className="teleport-map-name">{point.target_map_name}</div>
                    {point.level_required && 
                        <div className="map-level-required">等级要求: {point.level_required}</div>
                    }
                </div>
            )) : null}
            
            {/* 渲染NPC */}
            {npcs && npcs.length > 0 ? npcs.map(npc => (
                <div 
                    key={`npc-${npc.id}`}
                    className={`npc ${npc.has_quest ? 'has-quest' : ''}`}
                    style={{
                        left: `${npc.x || 400}px`,
                        top: `${npc.y || 400}px`
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNpcClick(npc.id);
                    }}
                >
                    <div className="npc-name">{npc.name}</div>
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
                    backgroundColor: 'blue',
                    borderRadius: '50%',
                    zIndex: 10,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
            ></div>
            
            {/* 渲染怪物 */}
            {monsters && monsters.length > 0 ? monsters.map(monster => (
                <div 
                    key={monster.id} 
                    className="monster" 
                    data-id={monster.id}
                    style={{ 
                        position: 'absolute',
                        left: `${monster.x || 100}px`, 
                        top: `${monster.y || 100}px`,
                        zIndex: 5
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMonsterClick(monster.id);
                    }}
                    title={`${monster.name} Lv.${monster.level || '?'} (点击攻击)`}
                >
                    <div className="monster-name">{monster.name}</div>
                    <div className="monster-hp-bar-container">
                        <div 
                            className="monster-hp-bar" 
                            style={{width: `${monster.hp_percentage || 100}%`}}
                        ></div>
                    </div>
                    <div className="monster-hp-text">{monster.current_hp || '?'}/{monster.hp || '?'}</div>
                    <div className="monster-emoji">{monster.emoji || '👾'}</div>
                </div>
            )) : <div style={{ position: 'absolute', top: '40px', left: '10px', color: 'white' }}>没有怪物</div>}
            
            {/* 渲染商店 */}
            {shops && shops.length > 0 ? shops.map(shop => (
                <div 
                    key={shop.id} 
                    className="shop" 
                    data-id={shop.id}
                    style={{ 
                        position: 'absolute',
                        left: `${shop.x || 200}px`, 
                        top: `${shop.y || 200}px`,
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'gold',
                        borderRadius: '5px',
                        zIndex: 5
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleShopClick(shop.id);
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
            {otherPlayers && otherPlayers.length > 0 ? otherPlayers.map(player => (
                <div 
                    key={`player-${player.id}`}
                    className="other-player"
                    style={{
                        position: 'absolute',
                        left: `${player.x || 150}px`,
                        top: `${player.y || 150}px`,
                        zIndex: 8
                    }}
                >
                    <div className="other-player-logo"></div>
                    <div className="player-name-container">
                        <span className="player-level">Lv.{player.level}</span>
                        <span className="player-name">{player.name}</span>
                    </div>
                </div>
            )) : null}
        </div>
    );
}

export default GameMap; 