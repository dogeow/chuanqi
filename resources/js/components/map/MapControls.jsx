import React from 'react';
import styled from '@emotion/styled';
import useGameStore from '../../store/gameStore';

const ControlsContainer = styled.div`
    position: fixed;
    top: 6px;
    right: 6px;
    display: flex;
    gap: 10px;
    z-index: 1000;
`;

const ControlButton = styled.button`
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

function MapControls({ onLocatePlayer }) {
    const { zoomLevel, setZoomLevel } = useGameStore();

    const handleZoom = (delta) => {
        setZoomLevel(Math.max(0.5, Math.min(2, zoomLevel + delta)));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
    };

    return (
        <ControlsContainer>
            <ControlButton onClick={onLocatePlayer} title="定位到玩家">👤</ControlButton>
            <ControlButton onClick={() => handleZoom(0.1)} title="放大">+</ControlButton>
            <ControlButton onClick={() => handleZoom(-0.1)} title="缩小">-</ControlButton>
            <ControlButton onClick={handleResetZoom} title="恢复原始大小">⟲</ControlButton>
        </ControlsContainer>
    );
}

export default MapControls; 