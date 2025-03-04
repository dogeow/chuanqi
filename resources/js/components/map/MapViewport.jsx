import React, { useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import useGameStore from '../../store/gameStore';

const ViewportContainer = styled.div`
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
`;

const MapContainer = styled.div`
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

function MapViewport({ children, mapData, onMapClick }) {
    const viewportRef = useRef(null);
    const { character, mapSize, zoomLevel, setViewportPosition } = useGameStore();

    // 视口跟随玩家
    useEffect(() => {
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
    }, [character?.position_x, character?.position_y]);

    // 监听视口滚动
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
    }, [setViewportPosition]);

    // 处理地图点击
    const handleMapClick = (e) => {
        if (!viewportRef.current) return;
        
        const viewportRect = viewportRef.current.getBoundingClientRect();
        const scrollLeft = viewportRef.current.scrollLeft;
        const scrollTop = viewportRef.current.scrollTop;
        
        const clickXRelativeToViewport = e.clientX - viewportRect.left;
        const clickYRelativeToViewport = e.clientY - viewportRect.top;
        
        const x = clickXRelativeToViewport + scrollLeft;
        const y = clickYRelativeToViewport + scrollTop;
        
        onMapClick(x, y);
    };

    return (
        <ViewportContainer ref={viewportRef}>
            <MapContainer 
                onClick={handleMapClick}
                width={mapSize.width}
                height={mapSize.height}
                zoomLevel={zoomLevel}
            >
                <MapBackground backgroundUrl={mapData?.background || '/images/default-map.jpg'} />
                <MapName>{mapData?.name || '未知地图'}</MapName>
                {children}
            </MapContainer>
        </ViewportContainer>
    );
}

export default MapViewport; 