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
    const { character, mapSize, zoomLevel, setViewportPosition } = useGameStore();
    const [isScrolling, setIsScrolling] = useState(false);
    const [shouldFollowPlayer, setShouldFollowPlayer] = useState(false);
    const lastPositionRef = useRef({ x: null, y: null });
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

    // 只在角色初次加载或传送后跟随一次
    useEffect(() => {
        if (!internalRef.current || !character?.position_x || !character?.position_y) return;
        
        const posX = Number(character.position_x);
        const posY = Number(character.position_y);
        
        // 检查是否是初次加载或传送
        if (lastPositionRef.current.x === null || 
            lastPositionRef.current.y === null ||
            Math.abs(lastPositionRef.current.x - posX) > 100 ||
            Math.abs(lastPositionRef.current.y - posY) > 100
        ) {
            const viewportWidth = internalRef.current.clientWidth;
            const viewportHeight = internalRef.current.clientHeight;
            
            const scrollX = Math.max(0, posX - (viewportWidth / 2));
            const scrollY = Math.max(0, posY - (viewportHeight / 2));
            
            internalRef.current.scrollTo({
                left: scrollX,
                top: scrollY,
                behavior: 'smooth'
            });
        }
        
        // 更新最后位置
        lastPositionRef.current = { x: posX, y: posY };
    }, [character?.position_x, character?.position_y]);

    // 监听视口滚动
    useEffect(() => {
        const viewport = internalRef.current;
        if (!viewport) return;

        let scrollTimeout;

        const handleScroll = () => {
            setIsScrolling(true);
            setViewportPosition({
                left: viewport.scrollLeft,
                top: viewport.scrollTop
            });
            
            // 滚动结束后重置状态
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                setIsScrolling(false);
            }, 150);
        };

        viewport.addEventListener('scroll', handleScroll);
        return () => {
            viewport.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [setViewportPosition]);

    // 处理地图点击
    const handleMapClick = useCallback((e) => {
        if (!internalRef.current) return;
        
        const viewportRect = internalRef.current.getBoundingClientRect();
        const scrollLeft = internalRef.current.scrollLeft;
        const scrollTop = internalRef.current.scrollTop;
        
        const clickXRelativeToViewport = e.clientX - viewportRect.left;
        const clickYRelativeToViewport = e.clientY - viewportRect.top;
        
        const x = (clickXRelativeToViewport + scrollLeft) / zoomLevel;
        const y = (clickYRelativeToViewport + scrollTop) / zoomLevel;
        
        onMapClick(x, y);
    }, [onMapClick, zoomLevel]);

    return (
        <MapViewport 
            ref={setRefs}
            onClick={handleMapClick}
        >
            <MapContainer 
                width={mapSize.width}
                height={mapSize.height}
                zoomLevel={zoomLevel}
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