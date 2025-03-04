import React, { useRef, useEffect, useState } from 'react';
import CollisionService from '../services/collisionService';
import useGameStore from '../store/gameStore';
import styled from '@emotion/styled';

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

const Player = styled.div`
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

const Monster = styled.div`
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

const DamageEffect = styled.div`
    position: absolute;
    left: ${props => props.x}px;
    top: ${props => props.y - 20}px;
    color: ${props => props.type === 'damage' ? '#ff3333' : '#33ff33'};
    font-weight: bold;
    font-size: 16px;
    z-index: 100;
    text-shadow: 0 0 3px black;
    animation: damageFloat 2s forwards;
    transform: translateX(-50%);
`;

const AttackEmoji = styled.div`
    position: absolute;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
    font-size: 24px;
    z-index: 101;
    animation: attackEmoji 1s forwards;
    transform: translateX(-50%);
`;

const TeleportPoint = styled.div`
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
            <GameMapViewport ref={viewportRef}>
                <GameMapContainer 
                    ref={gameMapRef}
                    onClick={handleMapClick}
                    width={mapSize.width}
                    height={mapSize.height}
                    zoomLevel={zoomLevel}
                >
                    <style>{animations}</style>
                    <MapBackground backgroundUrl={backgroundUrl} />
                    <MapName>{mapData.name || '未知地图'}</MapName>

                    {/* 渲染传送点 */}
                    {teleportPoints && teleportPoints.length > 0 && teleportPoints.map(point => (
                        <TeleportPoint
                            key={`teleport-${point.id}`}
                            x={point.x || 300}
                            y={point.y || 300}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTeleportClick(point.target_map_id);
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
                        </TeleportPoint>
                    ))}

                    {/* 渲染玩家角色 */}
                    <Player
                        ref={playerRef}
                        x={character?.position_x || 100}
                        y={character?.position_y || 100}
                        isColliding={collisions.monsters.length > 0 || collisions.players.length > 0}
                        isHpChanging={character?.lastHp !== character?.current_hp && character?.lastHp > character?.current_hp}
                    >
                        <PlayerLevel>Lv.{character?.level || 1}</PlayerLevel>
                        
                        <HpBarContainer>
                            <HpBar 
                                percentage={character?.current_hp && character?.max_hp ? (character.current_hp / character.max_hp) * 100 : 100}
                                isChanging={character?.lastHp !== character?.current_hp}
                            />
                        </HpBarContainer>
                        
                        <HpText>
                            {character?.current_hp || '???'}/{character?.max_hp || '?'}
                        </HpText>
                        
                        <div style={{ fontSize: '16px' }}>
                            {character?.lastHp !== character?.current_hp && character?.lastHp > character?.current_hp ? '😣' : '😊'}
                        </div>
                        
                        {(collisions.monsters.length > 0 || collisions.players.length > 0) && (
                            <CollisionIndicator>碰撞中!</CollisionIndicator>
                        )}
                    </Player>

                    {/* 渲染怪物 */}
                    {monsters && monsters.length > 0 && monsters.filter(monster => !monster.is_dead && monster.current_hp > 0).map(monster => {
                        const isColliding = collisions.monsters.some(m => m.id === monster.id);
                        
                        return (
                            <Monster
                                key={monster.id}
                                x={monster.x || monster.position_x || 100}
                                y={monster.y || monster.position_y || 100}
                                isColliding={isColliding}
                                isBeingAttacked={isMonsterBeingAttacked(monster.id)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMonsterClick(monster.id);
                                }}
                                title={`${monster.name} Lv.${monster.level || '?'} (点击攻击)`}
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
                                
                                {isColliding && <CollisionIndicator>碰撞!</CollisionIndicator>}
                            </Monster>
                        );
                    })}

                    {/* 渲染伤害效果 */}
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
                </GameMapContainer>
            </GameMapViewport>

            <ZoomControls>
                <ZoomButton onClick={handleLocatePlayer} title="定位到玩家">👤</ZoomButton>
                <ZoomButton onClick={() => handleZoom(0.1)}>+</ZoomButton>
                <ZoomButton onClick={() => handleZoom(-0.1)}>-</ZoomButton>
                <ZoomButton onClick={handleResetZoom} title="恢复原始大小">⟲</ZoomButton>
            </ZoomControls>

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

                {/* 视口范围指示器 */}
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