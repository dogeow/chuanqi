import React, { useRef, useEffect, useState, useCallback, memo, forwardRef } from 'react';
import styled from '@emotion/styled';
import useGameStore from '../../store/gameStore';
import { colors } from '../../theme';

const MapViewport = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: ${colors.background.primary};
    
    /* 确保滚动平滑 */
    scroll-behavior: smooth;
    
    /* 防止iOS橡皮筋效果 */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
`;

const MapContainer = styled.div`
    background-color: #111;
    position: relative;
    width: ${props => props.width * props.zoomLevel}px;
    height: ${props => props.height * props.zoomLevel}px;
    transform-origin: 0 0;
    transition: width 0.3s ease, height 0.3s ease;
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

const MapViewportComponent = forwardRef(({ children, mapData, onMapClick }, ref) => {
    const { character, mapSize, zoomLevel, setViewportPosition, collisions, isCollisionEnabled } = useGameStore();
    const [isScrolling, setIsScrolling] = useState(false);
    const [shouldFollowPlayer, setShouldFollowPlayer] = useState(true);
    const internalRef = useRef(null);
    
    // 合并外部和内部的 ref
    const setRefs = useCallback((element) => {
        internalRef.current = element;
        if (typeof ref === 'function') {
            ref(element);
        } else if (ref) {
            ref.current = element;
        }
    }, [ref]);

    // 计算视口中心位置
    useEffect(() => {
        if (!character || !internalRef.current) return;

        const viewport = internalRef.current;
        const viewportWidth = viewport.clientWidth;
        const viewportHeight = viewport.clientHeight;

        // 计算目标滚动位置，使角色保持在视口中心
        const targetX = Math.max(0, (character.position_x * zoomLevel) - (viewportWidth / 2));
        const targetY = Math.max(0, (character.position_y * zoomLevel) - (viewportHeight / 2));

        // 限制滚动范围不超过地图边界
        const maxScrollX = Math.max(0, (mapSize.width * zoomLevel) - viewportWidth);
        const maxScrollY = Math.max(0, (mapSize.height * zoomLevel) - viewportHeight);

        setViewportPosition({
            x: Math.min(targetX, maxScrollX),
            y: Math.min(targetY, maxScrollY)
        });
    }, [character?.position_x, character?.position_y, zoomLevel, mapSize.width, mapSize.height]);

    // 监听视口滚动
    useEffect(() => {
        const viewport = internalRef.current;
        if (!viewport) return;

        let scrollTimeout;

        const handleScroll = () => {
            if (!shouldFollowPlayer) {
                setIsScrolling(true);
                setViewportPosition({
                    x: viewport.scrollLeft,
                    y: viewport.scrollTop
                });
                
                // 滚动结束后重置状态
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    setIsScrolling(false);
                }, 150);
            }
        };

        viewport.addEventListener('scroll', handleScroll);
        return () => {
            viewport.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [setViewportPosition, shouldFollowPlayer]);

    const handleClick = (e) => {
        // 如果点击的是特殊元素（怪物、商店等），不处理地图点击
        if (e.target.closest('.monster, .shop, .teleport-point, .npc')) {
            return;
        }

        // 阻止事件冒泡
        e.stopPropagation();

        // 计算相对于地图的点击坐标
        const viewport = internalRef.current;
        const rect = viewport.getBoundingClientRect();
        const scrollLeft = viewport.scrollLeft;
        const scrollTop = viewport.scrollTop;
        
        // 修正坐标计算方式
        const x = Math.round((e.clientX - rect.left + scrollLeft) / zoomLevel);
        const y = Math.round((e.clientY - rect.top + scrollTop) / zoomLevel);

        // 检查是否启用碰撞检测
        if (isCollisionEnabled) {
            // 检查点击位置是否有碰撞
            const hasCollision = collisions.monsters.some(monster => {
                const dx = monster.x - x;
                const dy = monster.y - y;
                return Math.sqrt(dx * dx + dy * dy) < 32;
            });

            if (hasCollision) {
                return;
            }
        }

        // 确保坐标在地图范围内
        const boundedX = Math.max(0, Math.min(x, mapSize.width));
        const boundedY = Math.max(0, Math.min(y, mapSize.height));

        // 调用点击回调
        onMapClick(boundedX, boundedY);
    };

    return (
        <MapViewport 
            ref={setRefs}
            onClick={handleClick}
            onMouseDown={(e) => {
                // 如果点击的是特殊元素，阻止事件冒泡
                if (e.target.closest('.monster, .shop, .teleport-point, .npc')) {
                    e.stopPropagation();
                }
            }}
            className="map-viewport"
        >
            <MapContainer 
                width={mapSize.width}
                height={mapSize.height}
                zoomLevel={zoomLevel}
                className="map-container"
            >
                <MapBackground 
                    backgroundUrl={mapData?.background || '/images/default-map.jpg'}
                    style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: '0 0'
                    }}
                />
                <MapName>{mapData?.name || '未知地图'}</MapName>
                <div style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}>
                    {children}
                </div>
            </MapContainer>
        </MapViewport>
    );
});

MapViewportComponent.displayName = 'MapViewportComponent';

export default memo(MapViewportComponent); 