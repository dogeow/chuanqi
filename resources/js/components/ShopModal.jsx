import React, { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';

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

  // 提取物品图标组件
  const ItemIcon = ({ image }) => {
    if (!image) return '📦';
    
    // 检查是否为emoji（通常emoji是字符而不是图片URL）
    if (!image.startsWith('/') && !image.startsWith('http')) {
        const emojis = Array.from(image);
        if (emojis.length < 2) return image;
        
        return (
            <span style={{ position: 'relative' }}>
                <span style={{ 
                    position: 'absolute', 
                    top: '0', 
                    left: '0', 
                    fontSize: '24px', 
                    opacity: '0.3', 
                    zIndex: 1 
                }}>
                    {emojis[1]}
                </span>
                <span style={{ position: 'relative', zIndex: 2 }}>
                    {emojis[0]}
                </span>
            </span>
        );
    }
    
    // 如果是图片URL，则使用img标签
    return <img src={image} alt="物品" style={{ width: '100%', height: '100%' }} />;
  };

  return (
    <div className="shop-modal">
      <div className="shop-modal-content">
        <div className="shop-modal-header">
          <h3>{shop.name} <span className="player-gold">您的金币: {character.gold}</span></h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="shop-modal-body">
          <div className="shop-items">
            {shopItems.length > 0 ? (
              shopItems.map(item => {
                const isConsumable = item.item && item.item.is_consumable;
                const itemName = item.item ? item.item.name : '未知物品';
                const itemType = item.item ? item.item.type : '未知类型';
                const itemDesc = item.item ? (item.item.description || '无描述') : '无描述';
                const itemImage = item.item && item.item.image ? item.item.image : '/images/items/default.png';
                const selectedQuantity = selectedQuantities[item.id] || 1;
                
                return (
                  <div 
                    key={item.id} 
                    className={`shop-item ${canAfford(item.price, selectedQuantity) ? 'can-afford' : 'cannot-afford'}`}
                  >
                    <div className="shop-item-header">
                      <div className="shop-item-icon">
                        <ItemIcon image={itemImage} />
                      </div>
                      <div className="shop-item-title">
                        <div className="shop-item-name">{itemName}</div>
                        <div className="shop-item-type">{itemType}</div>
                      </div>
                    </div>
                    <div className="shop-item-details">
                      <div className="shop-item-description">{itemDesc}</div>
                      <div className="shop-item-price">价格: {item.price} 金币</div>
                    </div>
                    
                    {isConsumable && (
                      <div className="quantity-selector">
                        <div className="quantity-label">数量:</div>
                        <div className="quantity-buttons">
                          <button 
                            className={`quantity-btn ${selectedQuantity === 1 ? 'selected' : ''}`}
                            onClick={() => handleQuantitySelect(item.id, 1)}
                          >
                            X1
                          </button>
                          <button 
                            className={`quantity-btn ${selectedQuantity === 10 ? 'selected' : ''} ${!canAfford(item.price, 10) ? 'disabled' : ''}`}
                            onClick={() => handleQuantitySelect(item.id, 10)}
                            disabled={!canAfford(item.price, 10)}
                          >
                            X10
                          </button>
                          <button 
                            className={`quantity-btn ${selectedQuantity === 100 ? 'selected' : ''} ${!canAfford(item.price, 100) ? 'disabled' : ''}`}
                            onClick={() => handleQuantitySelect(item.id, 100)}
                            disabled={!canAfford(item.price, 100)}
                          >
                            X100
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className={`buy-btn ${!canAfford(item.price, selectedQuantity) ? 'disabled' : ''}`}
                      onClick={() => handleBuy(item.id)}
                      disabled={!canAfford(item.price, selectedQuantity)}
                      title={!canAfford(item.price, selectedQuantity) ? '金币不足' : ''}
                    >
                      购买{isConsumable ? ` x${selectedQuantity}` : ''}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="no-items">该商店暂无商品</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopModal; 