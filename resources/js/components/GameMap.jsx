import React, { useRef, useEffect, useState } from 'react';

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
    
    // 调试信息
    useEffect(() => {
        console.log('地图数据:', mapData);
        console.log('怪物数据:', monsters);
        console.log('NPC数据:', npcs);
        console.log('传送点数据:', teleportPoints);
        console.log('角色位置:', character?.position_x, character?.position_y);
        
        // 如果地图有自定义尺寸，则使用
        if (mapData && (mapData.width || mapData.height)) {
            setMapSize({
                width: mapData.width || 1000,
                height: mapData.height || 1000
            });
        }
        
        // 初始化怪物和玩家的血量状态
        if (monsters && monsters.length > 0) {
            monsters.forEach(monster => {
                if (monster.lastHp === undefined) {
                    monster.lastHp = monster.current_hp;
                }
            });
        }
        
        if (character && character.lastHp === undefined) {
            character.lastHp = character.current_hp;
        }
    }, [mapData, monsters, npcs, teleportPoints, character]);
    
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
        
        // 获取点击位置相对于地图的坐标（考虑滚动位置）
        const rect = gameMapRef.current.getBoundingClientRect();
        const scrollLeft = viewportRef.current.scrollLeft;
        const scrollTop = viewportRef.current.scrollTop;
        
        const x = e.clientX - rect.left + scrollLeft;
        const y = e.clientY - rect.top + scrollTop;
        
        console.log('点击地图位置:', x, y);
        
        // 移动角色到点击位置
        onMove(x, y);
    }
    
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
    
    return (
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
                    height: `${mapSize.height}px`
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
                            border: '2px solid #fff',
                            animation: 'pulse 2s infinite'
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
                            left: `${npc.position_x || 400}px`,
                            top: `${npc.position_y || 400}px`
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onNpcClick(npc.id);
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
                        backgroundColor: '#3366ff',
                        borderRadius: '50%',
                        zIndex: 10,
                        left: `${character?.position_x || 100}px`,
                        top: `${character?.position_y || 100}px`,
                        transform: 'translate(-50%, -50%)',
                        transition: 'left 0.2s ease-out, top 0.2s ease-out',
                        boxShadow: '0 0 10px rgba(51, 102, 255, 0.7)',
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
                        top: '-15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        whiteSpace: 'nowrap'
                    }}>Lv.{character?.level || 1}</div>
                    
                    {/* 玩家血条 */}
                    {character && character.current_hp !== undefined && character.hp !== undefined && (
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
                                    width: `${(character.current_hp / character.hp) * 100}%`,
                                    height: '100%',
                                    backgroundColor: '#ff3333',
                                    transition: 'width 0.3s ease-out',
                                    animation: character.lastHp !== character.current_hp ? 'hpChange 0.5s' : 'none'
                                }}
                            ></div>
                        </div>
                    )}
                    
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
                </div>
                
                {/* 渲染怪物 */}
                {monsters && monsters.length > 0 ? monsters.filter(monster => !monster.is_dead && monster.current_hp > 0).map(monster => (
                    <div 
                        key={monster.id} 
                        className="monster" 
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
                            boxShadow: isMonsterBeingAttacked(monster.id) ? '0 0 10px rgba(255, 0, 0, 0.7)' : 'none'
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
                                    width: `${monster.hp_percentage || (monster.current_hp / monster.hp) * 100 || 100}%`,
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
                                transform: isMonsterBeingAttacked(monster.id) ? 'scale(1.2)' : 'scale(1)',
                                transition: 'transform 0.2s ease-out',
                                animation: isMonsterBeingAttacked(monster.id) ? 'attackPulse 0.5s infinite' : 'none'
                            }}
                        >
                            {monster.emoji || '👾'}
                            {isMonsterBeingAttacked(monster.id) && (
                                <span style={{ 
                                    position: 'absolute', 
                                    top: '-10px', 
                                    right: '-10px', 
                                    fontSize: '16px',
                                    animation: 'attackPulse 0.3s infinite'
                                }}>💥</span>
                            )}
                        </div>
                    </div>
                )) : <div style={{ position: 'absolute', top: '40px', left: '10px', color: 'white' }}>没有怪物</div>}
                
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
                    console.log('渲染其他玩家:', player);
                    // 确保使用正确的位置属性
                    const playerX = player.position_x !== undefined ? player.position_x : (player.x || 150);
                    const playerY = player.position_y !== undefined ? player.position_y : (player.y || 150);
                    
                    return (
                        <div 
                            key={`player-${player.id}`}
                            className="other-player"
                            style={{
                                position: 'absolute',
                                width: '32px',
                                height: '32px',
                                backgroundColor: 'green',
                                borderRadius: '50%',
                                zIndex: 8,
                                left: `${playerX}px`,
                                top: `${playerY}px`,
                                transform: 'translate(-50%, -50%)',
                                transition: 'left 0.3s ease-out, top 0.3s ease-out'
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
                
                {/* 添加小地图指示器 */}
                <div className="mini-map" style={{
                    position: 'fixed',
                    width: '100px',
                    height: '100px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    border: '2px solid #444',
                    borderRadius: '5px',
                    zIndex: 20,
                    overflow: 'hidden'
                }}>
                    <div className="mini-map-content" style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%'
                    }}>
                        {/* 玩家位置指示器 */}
                        <div className="mini-map-player" style={{
                            position: 'absolute',
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#3366ff',
                            borderRadius: '50%',
                            left: `${((character?.position_x || 0) / mapSize.width) * 100}%`,
                            top: `${((character?.position_y || 0) / mapSize.height) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2
                        }}></div>
                        
                        {/* 怪物位置指示器 */}
                        {monsters && monsters.filter(monster => !monster.is_dead && monster.current_hp > 0).map(monster => (
                            <div 
                                key={`mini-monster-${monster.id}`}
                                className="mini-map-monster"
                                style={{
                                    position: 'absolute',
                                    width: '4px',
                                    height: '4px',
                                    backgroundColor: 'red',
                                    borderRadius: '50%',
                                    left: `${((monster.x || monster.position_x || 0) / mapSize.width) * 100}%`,
                                    top: `${((monster.y || monster.position_y || 0) / mapSize.height) * 100}%`,
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 1
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GameMap; 