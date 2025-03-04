import React from 'react';
import styled from '@emotion/styled';
import useGameStore from '../../store/gameStore';

const MiniMapContainer = styled.div`
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

const PlayerIndicator = styled.div`
    position: absolute;
    width: 6px;
    height: 6px;
    background-color: #3366ff;
    border-radius: 50%;
    left: ${props => props.left}%;
    top: ${props => props.top}%;
    transform: translate(-50%, -50%);
    z-index: 2;
    transition: all ${props => props.duration || 0.5}s linear;
`;

const OtherPlayerIndicator = styled.div`
    position: absolute;
    width: 4px;
    height: 4px;
    background-color: #ffcc00;
    border-radius: 50%;
    left: ${props => props.left}%;
    top: ${props => props.top}%;
    transform: translate(-50%, -50%);
    z-index: 1;
    transition: all ${props => props.duration || 0.5}s linear;
`;

const MonsterIndicator = styled.div`
    position: absolute;
    width: 4px;
    height: 4px;
    background-color: #33cc33;
    border-radius: 50%;
    left: ${props => props.left}%;
    top: ${props => props.top}%;
    transform: translate(-50%, -50%);
    z-index: 1;
`;

const TeleportIndicator = styled.div`
    position: absolute;
    width: 4px;
    height: 4px;
    background-color: #9966ff;
    border-radius: 50%;
    left: ${props => props.left}%;
    top: ${props => props.top}%;
    transform: translate(-50%, -50%);
    z-index: 1;
`;

const ViewportIndicator = styled.div`
    position: absolute;
    width: ${props => props.width}%;
    height: ${props => props.height}%;
    border: 1px solid rgba(255, 255, 255, 0.5);
    left: ${props => props.left}%;
    top: ${props => props.top}%;
    pointer-events: none;
`;

function MiniMap({ viewportRef, onMiniMapClick }) {
    const { 
        character, 
        monsters, 
        mapSize, 
        viewportPosition,
        otherPlayers,
        teleportPoints 
    } = useGameStore();

    const handleClick = (e) => {
        if (!viewportRef.current) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * mapSize.width;
        const y = (e.clientY - rect.top) / rect.height * mapSize.height;
        
        onMiniMapClick(x, y);
    };

    const getViewportDimensions = () => {
        if (!viewportRef.current) return { width: 0, height: 0 };
        
        return {
            width: (viewportRef.current.clientWidth / mapSize.width) * 100,
            height: (viewportRef.current.clientHeight / mapSize.height) * 100,
            left: (viewportPosition.left / mapSize.width) * 100,
            top: (viewportPosition.top / mapSize.height) * 100
        };
    };

    const viewportDimensions = getViewportDimensions();

    return (
        <MiniMapContainer onClick={handleClick}>
            {/* 玩家指示器 */}
            {character && (
                <PlayerIndicator
                    left={(character.position_x / mapSize.width) * 100}
                    top={(character.position_y / mapSize.height) * 100}
                    duration={0.5}
                />
            )}

            {/* 其他玩家位置指示器 */}
            {otherPlayers?.map(player => (
                <OtherPlayerIndicator
                    key={`mini-player-${player.id}`}
                    left={(player.position_x || player.x || 0) / mapSize.width * 100}
                    top={(player.position_y || player.y || 0) / mapSize.height * 100}
                    duration={0.5}
                />
            ))}

            {/* 传送点指示器 */}
            {teleportPoints?.map(point => (
                <TeleportIndicator
                    key={`mini-teleport-${point.id}`}
                    left={(point.position_x || point.x || 0) / mapSize.width * 100}
                    top={(point.position_y || point.y || 0) / mapSize.height * 100}
                />
            ))}

            {/* 视口范围指示器 */}
            {viewportRef.current && (
                <ViewportIndicator {...viewportDimensions} />
            )}

            {/* 怪物位置指示器 */}
            {monsters?.map(monster => (
                <MonsterIndicator
                    key={`mini-monster-${monster.id}`}
                    left={(monster.position_x || monster.x || 0) / mapSize.width * 100}
                    top={(monster.position_y || monster.y || 0) / mapSize.height * 100}
                />
            ))}
        </MiniMapContainer>
    );
}

export default MiniMap; 