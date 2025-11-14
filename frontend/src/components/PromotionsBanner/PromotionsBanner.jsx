import React, { useState, useEffect } from 'react';
import { FaTag, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { formatPriceConverted } from '../../utils/currency';
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
        // Value is stored in ILS, convert to current currency
        return `${formatPriceConverted(value, currency)} OFF`;
      default:
        return '';
    }
  };

  const getApplicableItems = (promotion) => {
    const applicableItems = [];
    
    // Don't try to match if products/categories haven't loaded yet
    if (!Array.isArray(products) || !Array.isArray(categories)) {
      return applicableItems;
    }
    
    try {
      // Parse applicable products
      if (promotion.applicable_products) {
        const productIds = JSON.parse(promotion.applicable_products);
        if (Array.isArray(productIds) && productIds.length > 0 && products.length > 0) {
          // Convert all IDs to strings for comparison to handle type mismatches
          const productIdStrings = productIds.map(id => String(id));
          const applicableProducts = products.filter(product => 
            productIdStrings.includes(String(product.product_id))
          );
          applicableItems.push(...applicableProducts.map(p => p.name));
        }
      }
      
      // Parse applicable categories
      if (promotion.applicable_categories) {
        const categoryIds = JSON.parse(promotion.applicable_categories);
        if (Array.isArray(categoryIds) && categoryIds.length > 0 && categories.length > 0) {
          // Convert all IDs to strings for comparison to handle type mismatches
          const categoryIdStrings = categoryIds.map(id => String(id));
          const applicableCategories = categories.filter(category => 
            categoryIdStrings.includes(String(category.category_id))
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
    // First check if promotion has any applicable items defined
    let hasApplicableProducts = false;
    let hasApplicableCategories = false;
    
    try {
      if (promotion.applicable_products) {
        const productIds = JSON.parse(promotion.applicable_products);
        hasApplicableProducts = Array.isArray(productIds) && productIds.length > 0;
      }
      if (promotion.applicable_categories) {
        const categoryIds = JSON.parse(promotion.applicable_categories);
        hasApplicableCategories = Array.isArray(categoryIds) && categoryIds.length > 0;
      }
    } catch (error) {
      console.error('Error parsing applicable items:', error);
    }
    
    // If promotion has no applicable items defined, show "All items"
    if (!hasApplicableProducts && !hasApplicableCategories) {
      return 'All items';
    }
    
    // Try to get the actual item names
    const items = getApplicableItems(promotion);
    
    // If we couldn't find items but promotion has them defined, show a generic message
    if (items.length === 0) {
      if (hasApplicableProducts && hasApplicableCategories) {
        return 'Selected products & categories';
      } else if (hasApplicableProducts) {
        return 'Selected products';
      } else if (hasApplicableCategories) {
        return 'Selected categories';
      }
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