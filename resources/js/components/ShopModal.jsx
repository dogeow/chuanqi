import React, { useState, useEffect, useMemo, memo } from 'react';
import useGameStore from '../store/gameStore';
import styled from '@emotion/styled';

// 样式定义
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: auto;
`;

const ModalContent = styled.div`
  background-color: #333;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  
  @media (min-width: 1024px) {
    max-width: 800px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #222;
  color: white;
  position: relative;
  flex-wrap: wrap;
  
  .shop-title {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    width: 100%;
  }
  
  .player-gold {
    font-size: 1rem;
    color: gold;
    display: block;
    text-align: center;
    margin-top: 5px;
    width: 100%;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 0 5px;
  position: absolute;
  right: 15px;
  top: 15px;
  z-index: 10;
  
  &:hover {
    color: #ff6b6b;
  }
`;

const ModalBody = styled.div`
  padding: 0;
  overflow-y: auto;
  max-height: calc(90vh - 60px);
  background-color: #333;
  
  @media (min-width: 1024px) {
    padding: 5px;
  }
`;

const ShopItems = styled.div`
  display: flex;
  flex-direction: column;
  
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 5px;
  }
`;

const ShopItem = styled.div`
  background-color: #333;
  padding: 15px;
  border-bottom: 1px solid #444;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &.cannot-afford {
    opacity: 0.7;
  }
  
  @media (min-width: 1024px) {
    border: 1px solid #444;
    border-radius: 8px;
    margin: 5px;
    height: 100%;
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 15px;
  
  @media (max-width: 480px) {
    align-items: flex-start;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 3;
  
  @media (max-width: 480px) {
    width: 100%;
    margin-bottom: 5px;
  }
`;

const ItemIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
`;

const ItemTextInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const ItemName = styled.div`
  font-weight: bold;
  font-size: 1.2rem;
  color: white;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemType = styled.div`
  font-size: 0.9rem;
  color: #aaa;
  text-transform: lowercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemPrice = styled.div`
  font-weight: bold;
  font-size: 1.2rem;
  color: #e67e22;
  flex: 1;
  text-align: right;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    width: 100%;
    text-align: left;
  }
`;

const ItemContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
  margin-top: 10px;
`;

const QuantitySelector = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const QuantityButtons = styled.div`
  display: flex;
  gap: 5px;
  flex: 3;
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const QuantityButton = styled.button`
  padding: 10px 0;
  background-color: ${props => props.selected ? '#4a90e2' : '#666'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
  font-weight: bold;
  font-size: 1rem;
  min-width: 50px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #555;
  }
`;

const BuyButton = styled.button`
  padding: 10px 0;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  transition: background-color 0.2s;
  flex: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 10px;
  
  @media (max-width: 480px) {
    margin-left: 0;
    width: 100%;
  }
  
  &:hover:not(:disabled) {
    background-color: #219653;
  }
  
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const NoItems = styled.div`
  text-align: center;
  padding: 30px;
  color: #aaa;
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
  selectedQuantity, 
  canAfford, 
  onQuantitySelect, 
  onBuy 
}) => {
  const isConsumable = item.item && item.item.is_consumable;
  const itemName = item.item ? item.item.name : '未知物品';
  const itemType = item.item ? item.item.type : '未知类型';
  const itemImage = item.item && item.item.image ? item.item.image : '/images/items/default.png';
  
  return (
    <ShopItem className={canAfford(item.price, selectedQuantity) ? 'can-afford' : 'cannot-afford'}>
      <ItemContent>
        <ItemHeader>
          <ItemInfo>
            <ItemIcon>
              <ItemIconComponent image={itemImage} />
            </ItemIcon>
            <ItemTextInfo>
              <ItemName>{itemName}</ItemName>
              <ItemType>{itemType}</ItemType>
            </ItemTextInfo>
          </ItemInfo>
          <ItemPrice>{item.price} 金币</ItemPrice>
        </ItemHeader>
        
        <ActionButtons>
          {isConsumable ? (
            <QuantitySelector>
              <QuantityButtons>
                <QuantityButton 
                  selected={selectedQuantity === 1}
                  onClick={() => onQuantitySelect(item.id, 1)}
                >
                  X1
                </QuantityButton>
                <QuantityButton 
                  selected={selectedQuantity === 10}
                  onClick={() => onQuantitySelect(item.id, 10)}
                  disabled={!canAfford(item.price, 10)}
                >
                  X10
                </QuantityButton>
                <QuantityButton 
                  selected={selectedQuantity === 100}
                  onClick={() => onQuantitySelect(item.id, 100)}
                  disabled={!canAfford(item.price, 100)}
                >
                  X100
                </QuantityButton>
              </QuantityButtons>
              <BuyButton 
                onClick={() => onBuy(item.id)}
                disabled={!canAfford(item.price, selectedQuantity)}
                title={!canAfford(item.price, selectedQuantity) ? '金币不足' : ''}
              >
                购买 x{selectedQuantity}
              </BuyButton>
            </QuantitySelector>
          ) : (
            <BuyButton 
              onClick={() => onBuy(item.id)}
              disabled={!canAfford(item.price, 1)}
              title={!canAfford(item.price, 1) ? '金币不足' : ''}
            >
              购买
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
  const [selectedQuantities, setSelectedQuantities] = useState({});

  // 初始化每个商品的默认数量为1
  useEffect(() => {
    const initialQuantities = {};
    shopItems.forEach(item => {
      initialQuantities[item.id] = 1;
    });
    setSelectedQuantities(initialQuantities);
  }, [shopItems]);

  // 处理数量选择
  const handleQuantitySelect = (itemId, quantity) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  // 处理购买按钮点击
  const handleBuy = async (shopItemId) => {
    const quantity = selectedQuantities[shopItemId] || 1;
    try {
      await onBuyItem(shopItemId, quantity);
    } catch (error) {
      console.error('购买物品失败:', error);
    }
  };

  // 检查是否能够购买指定数量的物品
  const canAfford = (price, quantity) => {
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
        selectedQuantity={selectedQuantities[item.id] || 1}
        canAfford={canAfford}
        onQuantitySelect={handleQuantitySelect}
        onBuy={handleBuy}
      />
    ));
  }, [shopItems, selectedQuantities, character.gold]);

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <div className="shop-title">{shop.name}</div>
          <div className="player-gold">您的金币: {character.gold}</div>
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