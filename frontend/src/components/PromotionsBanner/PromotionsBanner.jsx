import React, { useState, useEffect } from 'react';
import { FaTag, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { formatPrice } from '../../utils/currency';
import PromoDetailsModal from '../PromoDetailsModal/PromoDetailsModal';
import './PromotionsBanner.css';

const PromotionsBanner = () => {
  const [promotions, setPromotions] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const { currency } = useSettings();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch promotions, categories, and products in parallel
        const [promotionsRes, categoriesRes, productsRes] = await Promise.all([
          axios.get('/api/promotions/active'),
          axios.get('/api/categories/public'),
          axios.get('/api/products')
        ]);
        
        setPromotions(promotionsRes.data);
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
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
      default:
        return '';
    }
  };

  const getApplicableItems = (promotion) => {
    const applicableItems = [];
    
    try {
      // Parse applicable products
      if (promotion.applicable_products) {
        const productIds = JSON.parse(promotion.applicable_products);
        if (Array.isArray(productIds) && productIds.length > 0) {
          const applicableProducts = products.filter(product => 
            productIds.includes(product.product_id) || productIds.includes(product.product_id.toString())
          );
          applicableItems.push(...applicableProducts.map(p => p.name));
        }
      }
      
      // Parse applicable categories
      if (promotion.applicable_categories) {
        const categoryIds = JSON.parse(promotion.applicable_categories);
        if (Array.isArray(categoryIds) && categoryIds.length > 0 && Array.isArray(categories)) {
          const applicableCategories = categories.filter(category => 
            categoryIds.includes(category.category_id) || categoryIds.includes(category.category_id.toString())
          );
          applicableItems.push(...applicableCategories.map(c => c.name));
        }
      }
    } catch (error) {
      console.error('Error parsing applicable items:', error);
    }
    
    return applicableItems;
  };

  const formatApplicableItems = (promotion) => {
    const items = getApplicableItems(promotion);

    if (items.length === 0) {
      return 'All items';
    }

    if (items.length === 1) {
      return items[0];
    }

    if (items.length === 2) {
      return `${items[0]} & ${items[1]}`;
    }

    if (items.length <= 5) {
      // Show all items if 5 or fewer
      return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;
    }

    // For more than 5 items, show first 4 and count
    return `${items.slice(0, 4).join(', ')}, & ${items.length - 4} more`;
  };

  const handlePromotionCodeClick = (promotion) => {
    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPromotion(null);
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
        <FaTag className="promotions-tag-icon" />
        <span className="promotions-title">Special Offers!</span>
        
        {promotions.slice(0, 3).map((promotion, index) => (
          <div key={promotion.promotion_id} className="promotion-item">
            <div className="promotion-details">
              <span className="promotion-value">
                {formatValue(promotion.type, promotion.value)}
              </span>
              <span className="promotion-applies-to">
                on {formatApplicableItems(promotion)}
              </span>
            </div>
            {promotion.code && (
              <button
                className="promotion-code-clickable"
                onClick={() => handlePromotionCodeClick(promotion)}
                title="Click to view promotion details"
              >
                {promotion.code}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Promotion Details Modal */}
      <PromoDetailsModal
        isOpen={isModalOpen}
        promotion={selectedPromotion}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PromotionsBanner; 