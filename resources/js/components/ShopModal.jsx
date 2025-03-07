import React, { useState, useEffect, useMemo, memo } from 'react';
import useGameStore from '../store/gameStore';
import styled from '@emotion/styled';
import {
  colors,
  spacing,
  fontSize,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  opacity
} from '../theme';

// 基础样式组件
const FlexBox = styled.div`
  display: flex;
  align-items: center;
`;

const FlexColumn = styled(FlexBox)`
  flex-direction: column;
`;

const FlexBetween = styled(FlexBox)`
  justify-content: space-between;
`;

const BaseText = styled.div`
  color: ${props => props.color || colors.text.primary};
  font-size: ${props => props.fontSize || fontSize.sm};
  font-weight: ${props => props.bold ? 'bold' : 'normal'};
  ${props => props.ellipsis && `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
`;

const BaseButton = styled.button`
  color: ${colors.text.primary};
  border: none;
  border-radius: ${borderRadius.sm};
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
  
  &:disabled {
    opacity: ${opacity.disabled};
    cursor: not-allowed;
    background-color: ${colors.button.disabled};
  }
`;

const BaseModal = styled.div`
  background-color: ${colors.background.primary};
  border-radius: ${borderRadius.md};
  overflow: hidden;
  box-shadow: ${shadows.modal};
`;

// 样式定义
const ModalOverlay = styled(FlexBox)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: ${colors.background.overlay};
  justify-content: center;
  z-index: ${zIndex.modal};
  pointer-events: auto;
`;

const ModalContent = styled(BaseModal)`
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  
  @media (min-width: ${breakpoints.desktop}) {
    max-width: 800px;
  }
`;

const ModalHeader = styled(FlexColumn)`
  padding: ${spacing.sm} ${spacing.md};
  background-color: ${colors.background.secondary};
  position: relative;
  
  .shop-title {
    font-size: ${fontSize.xl};
    font-weight: bold;
    text-align: center;
    width: 100%;
  }
  
  .player-sliver {
    font-size: 2rem;
    color: ${colors.text.silver};
    text-align: center;
    margin-top: ${spacing.xs};
    width: 100%;
  }
`;

const CloseButton = styled(BaseButton)`
  background: none;
  font-size: ${fontSize.xxl};
  padding: 0 ${spacing.xs};
  position: absolute;
  right: ${spacing.md};
  top: ${spacing.md};
  z-index: 10;
  
  &:hover {
    color: ${colors.danger};
  }
`;

const ModalBody = styled.div`
  padding: 0;
  overflow-y: auto;
  max-height: calc(90vh - 60px);
  background-color: ${colors.background.primary};
  
  @media (min-width: ${breakpoints.desktop}) {
    padding: ${spacing.xs};
  }
`;

const ShopItems = styled.div`
  display: flex;
  gap: ${spacing.xs};
  flex-wrap: wrap;
  justify-content: space-evenly;
  margin-bottom: 10px;
  
  @media (min-width: ${breakpoints.mobile}) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${spacing.xs};
  }
  
  @media (min-width: ${breakpoints.desktop}) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${spacing.xs};
  }
`;

const ShopItem = styled(BaseModal)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 4px;
  width: 45%;
  
  &.cannot-afford {
    opacity: ${opacity.dimmed};
  }
  
  @media (min-width: ${breakpoints.desktop}) {
    border: 1px solid ${colors.border.primary};
    margin: ${spacing.xs};
  }
`;

const ItemHeader = styled(FlexBetween)`
  width: 100%;
  
  @media (max-width: ${breakpoints.mobile}) {
    align-items: flex-start;
  }
`;

const ItemInfo = styled(FlexBox)`
  gap: ${spacing.sm};
  flex: 3;
  
  @media (max-width: ${breakpoints.mobile}) {
    width: 100%;
  }
`;

const ItemIcon = styled(FlexBox)`
  width: ${fontSize.sm};
  height: ${fontSize.sm};
  justify-content: center;
  font-size: ${fontSize.sm};
  flex-shrink: 0;
`;

const ItemTextInfo = styled(FlexColumn)`
  min-width: 0;
`;

const ItemName = styled(BaseText)`
  font-size: ${fontSize.sm};
  font-weight: bold;
`;

const ItemType = styled(BaseText)`
  font-size: ${fontSize.xs};
  color: ${colors.text.secondary};
  text-transform: lowercase;
`;

const ItemPrice = styled(BaseText)`
  font-size: ${fontSize.lg};
  font-weight: bold;
  color: ${colors.text.silver};
  flex: 1;
  text-align: right;
  white-space: nowrap;
  
  @media (max-width: ${breakpoints.mobile}) {
    width: 100%;
    text-align: left;
  }
`;

const ItemContent = styled(FlexColumn)`
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const ActionButtons = styled(FlexColumn)`
  width: 100%;
  gap: ${spacing.sm};
  margin-top: ${spacing.sm};
`;

const QuantitySelector = styled(FlexBox)`
  width: 100%;
  gap: ${spacing.xs};
`;

const QuantityButtons = styled(FlexBox)`
  gap: ${spacing.xs};
  flex: 3;
  
  @media (max-width: ${breakpoints.mobile}) {
    width: 100%;
  }
`;

const QuantityButton = styled(BaseButton)`
  background-color: ${props => props.disable ? colors.button.disabled : colors.success};
  flex: 1;
  font-size: ${fontSize.sm};
  min-width: 50px;
`;

const BuyButton = styled(BaseButton)`
  background-color: ${colors.success};
  font-size: ${fontSize.md};
  flex: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: ${spacing.sm};
  
  @media (max-width: ${breakpoints.mobile}) {
    margin-left: 0;
    width: 100%;
  }
`;

const NoItems = styled(BaseText)`
  text-align: center;
  padding: ${spacing.xl};
  color: ${colors.text.secondary};
  font-style: italic;
`;

const EmojiContainer = styled.span`
  position: relative;
`;

const EmojiBackground = styled.span`
  position: absolute; 
  top: 0; 
  left: 0; 
  font-size: 24px; 
  opacity: 0.3; 
  z-index: 1;
`;

const EmojiForeground = styled.span`
  position: relative;
  z-index: 2;
`;

// 物品图标组件
const ItemIconComponent = memo(({ image }) => {
  if (!image) return '📦';
  
  // 检查是否为emoji
  if (!image.startsWith('/') && !image.startsWith('http')) {
    const emojis = Array.from(image);
    if (emojis.length < 2) return image;
    
    return (
      <EmojiContainer>
        <EmojiBackground>{emojis[1]}</EmojiBackground>
        <EmojiForeground>{emojis[0]}</EmojiForeground>
      </EmojiContainer>
    );
  }
  
  // 如果是图片URL
  return <img src={image} alt="物品" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
});

// 单个商品组件
const ShopItemComponent = memo(({ 
  item, 
  canAfford, 
  onBuy 
}) => {
  const isConsumable = item.item && item.item.is_consumable;
  const itemName = item.item ? item.item.name : '未知物品';
  const itemType = item.item ? item.item.type : '未知类型';
  const itemImage = item.item && item.item.image ? item.item.image : '/images/items/default.png';
  
  return (
    <ShopItem className={canAfford(item.price) ? 'can-afford' : 'cannot-afford'}>
      <ItemContent>
        <ItemHeader>
          <ItemInfo>
            <ItemIcon>
              <ItemIconComponent image={itemImage} />
            </ItemIcon>
            <ItemTextInfo>
              <ItemName>{itemName}</ItemName>
            </ItemTextInfo>
          </ItemInfo>
          {isConsumable ? <ItemPrice>🪙 {item.price}</ItemPrice> : ''}
        </ItemHeader>
        
        <ActionButtons>
          {isConsumable ? (
            <QuantitySelector>
              <QuantityButtons>
                <QuantityButton 
                  onClick={() => onBuy(item.id)}
                  disabled={!canAfford(item.price, 1)}
                >
                  X1
                </QuantityButton>
                <QuantityButton 
                  onClick={() => onBuy(item.id, 10)}
                  disabled={!canAfford(item.price, 10)}
                >
                  X10
                </QuantityButton>
                <QuantityButton 
                  onClick={() => onBuy(item.id, 100)}
                  disabled={!canAfford(item.price, 100)}
                >
                  X100
                </QuantityButton>
              </QuantityButtons>
            </QuantitySelector>
          ) : (
            <BuyButton 
              onClick={() => onBuy(item.id)}
              disabled={!canAfford(item.price, 1)}
              title={!canAfford(item.price, 1) ? '🪙 不足' : ''}
            >
              🪙 {item.price}
            </BuyButton>
          )}
        </ActionButtons>
      </ItemContent>
    </ShopItem>
  );
});

// 商店模态框组件
const ShopModal = ({ shop, shopItems, onClose, onBuyItem }) => {
  const { character } = useGameStore();

  // 处理购买按钮点击
  const handleBuy = async (shopItemId, quantity) => {
    try {
      await onBuyItem(shopItemId, quantity);
    } catch (error) {
      console.error('购买物品失败:', error);
    }
  };

  // 检查是否能够购买指定数量的物品
  const canAfford = (price, quantity=1) => {
    return character.gold >= price * quantity;
  };

  // 使用 useMemo 优化商品列表渲染
  const renderedItems = useMemo(() => {
    if (shopItems.length === 0) {
      return <NoItems>该商店暂无商品</NoItems>;
    }
    
    return shopItems.map(item => (
      <ShopItemComponent
        key={item.id}
        item={item}
        canAfford={canAfford}
        onBuy={handleBuy}
      />
    ));
  }, [shopItems, character.gold]);

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <div className="shop-title">{shop.name}</div>
          <div className="player-sliver">🪙 {character.gold}</div>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          <ShopItems>
            {renderedItems}
          </ShopItems>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ShopModal;