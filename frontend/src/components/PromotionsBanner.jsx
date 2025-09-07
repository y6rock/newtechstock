import React, { useState, useEffect } from 'react';
import { FaTag, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/currency';
import './PromotionsBanner.css';

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
    <div className="promotions-banner">
      <button
        onClick={() => setIsVisible(false)}
        className="promotions-close-button"
      >
        <FaTimes />
      </button>
      
      <div className="promotions-content">
        <div className="promotions-header">
          <FaTag className="promotions-tag-icon" />
          <span className="promotions-title">Special Offers!</span>
        </div>
        
        {promotions.slice(0, 3).map((promotion, index) => (
          <div key={promotion.promotion_id} className="promotion-item">
            <span className="promotion-value">
              {formatValue(promotion.type, promotion.value)}
            </span>
            {promotion.code && (
              <span className="promotion-code">
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