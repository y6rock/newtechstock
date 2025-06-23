import React, { useState, useEffect } from 'react';
import { FaTag, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/currency';

const PromotionsBanner = () => {
  const [promotions, setPromotions] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const { currency } = useSettings();
  const [currentPromotionIndex, setCurrentPromotionIndex] = useState(0);

  useEffect(() => {
    const fetchActivePromotions = async () => {
      try {
        const response = await axios.get('/api/promotions/active');
        setPromotions(response.data);
      } catch (error) {
        console.error('Error fetching promotions:', error);
      }
    };

    fetchActivePromotions();
  }, []);

  if (!isVisible || promotions.length === 0) {
    return null;
  }

  const formatValue = (type, value) => {
    switch (type) {
      case 'percentage':
        return `${value}% OFF`;
      case 'fixed':
        return `${formatPrice(value, currency)} OFF`;
      case 'buy_x_get_y':
        const [buyX, getY] = value.split(':');
        return `BUY ${buyX} GET ${getY} FREE`;
      default:
        return '';
    }
  };

  return (
    <div style={{
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '15px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '15px',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '18px',
          zIndex: 2
        }}
      >
        <FaTimes />
      </button>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaTag style={{ fontSize: '20px' }} />
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Special Offers!</span>
        </div>
        
        {promotions.slice(0, 3).map((promotion, index) => (
          <div key={promotion.promotion_id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 15px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            <span style={{ fontWeight: 'bold' }}>
              {formatValue(promotion.type, promotion.value)}
            </span>
            {promotion.code && (
              <span style={{ 
                backgroundColor: 'rgba(255,255,255,0.3)', 
                padding: '2px 8px', 
                borderRadius: '10px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {promotion.code}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsBanner; 