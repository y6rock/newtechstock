import React, { useEffect, useState } from 'react';
import { FaTimes, FaTag, FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { formatPrice } from '../../utils/currency';
import './PromoDetailsModal.css';

const PromoDetailsModal = ({ isOpen, promotion, onClose }) => {
  const { currency } = useSettings();
  const [applicableProducts, setApplicableProducts] = useState([]);
  const [applicableCategories, setApplicableCategories] = useState([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  // Fetch applicable products and categories when modal opens
  useEffect(() => {
    if (isOpen && promotion) {
      const fetchApplicableItems = async () => {
        setLoadingItems(true);
        try {
          // Fetch products if applicable_products exists
          if (promotion.applicable_products) {
            try {
              const productIds = JSON.parse(promotion.applicable_products);
              if (Array.isArray(productIds) && productIds.length > 0) {
                const response = await axios.get('/api/products/by-ids', {
                  params: { ids: productIds.join(',') }
                });
                setApplicableProducts(response.data || []);
              }
            } catch (error) {
              console.error('Error fetching products:', error);
            }
          }

          // Fetch categories if applicable_categories exists
          if (promotion.applicable_categories) {
            try {
              const categoryIds = JSON.parse(promotion.applicable_categories);
              if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                const response = await axios.get('/api/categories/by-ids', {
                  params: { ids: categoryIds.join(',') }
                });
                setApplicableCategories(response.data || []);
              }
            } catch (error) {
              console.error('Error fetching categories:', error);
            }
          }
        } catch (error) {
          console.error('Error fetching applicable items:', error);
        } finally {
          setLoadingItems(false);
        }
      };

      fetchApplicableItems();
    }
  }, [isOpen, promotion]);

  // Focus trap for accessibility
  useEffect(() => {
    if (isOpen) {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              lastFocusable.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              firstFocusable.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstFocusable?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen]);

  if (!isOpen || !promotion) return null;

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderApplicableItems = (items, type, showAll, setShowAll) => {
    if (items.length === 0) return null;

    const displayLimit = 3;
    const shouldShowToggle = items.length > displayLimit;
    const itemsToShow = showAll ? items : items.slice(0, displayLimit);

    return (
      <div className="applicable-items-section">
        <div className="applicable-items-header">
          <span className="applicable-items-label">{type}:</span>
        </div>
        <div className="applicable-items-list">
          {itemsToShow.map((item, index) => (
            <span key={index} className="applicable-item">
              {item.name}
              {index < itemsToShow.length - 1 && ', '}
            </span>
          ))}
          {shouldShowToggle && !showAll && (
            <span className="applicable-items-more">
              {' '}and {items.length - displayLimit} more
            </span>
          )}
        </div>
        {shouldShowToggle && (
          <button
            className="show-all-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <FaChevronUp />
                Show Less
              </>
            ) : (
              <>
                <FaChevronDown />
                Show All {items.length} {type}
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="promo-details-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="promo-details-close-button"
          aria-label="Close promotion details"
        >
          <FaTimes />
        </button>

        <div className="promo-details-header">
          <FaTag className="promo-details-icon" />
          <h2 className="promo-details-title">Promotion Details</h2>
        </div>

        <div className="promo-details-body">
          <div className="promo-detail-row">
            <span className="promo-detail-label">Promotion Code:</span>
            <span className="promo-detail-value promo-code-highlight">
              {promotion.code}
            </span>
          </div>

          <div className="promo-detail-row">
            <span className="promo-detail-label">Discount:</span>
            <span className="promo-detail-value">
              {formatValue(promotion.type, promotion.value)}
            </span>
          </div>

          {/* Applicable Products */}
          {renderApplicableItems(applicableProducts, 'Products', showAllProducts, setShowAllProducts)}

          {/* Applicable Categories */}
          {renderApplicableItems(applicableCategories, 'Categories', showAllCategories, setShowAllCategories)}

          {/* Fallback if no specific items */}
          {applicableProducts.length === 0 && applicableCategories.length === 0 && (
            <div className="promo-detail-row">
              <span className="promo-detail-label">Applies To:</span>
              <span className="promo-detail-value">All items</span>
            </div>
          )}

          {promotion.min_quantity && (
            <div className="promo-detail-row">
              <span className="promo-detail-label">Minimum Quantity:</span>
              <span className="promo-detail-value">
                {promotion.min_quantity}
              </span>
            </div>
          )}

          {promotion.max_quantity && (
            <div className="promo-detail-row">
              <span className="promo-detail-label">Maximum Quantity:</span>
              <span className="promo-detail-value">
                {promotion.max_quantity}
              </span>
            </div>
          )}

          <div className="promo-detail-row">
            <span className="promo-detail-label">Valid Until:</span>
            <span className="promo-detail-value">
              <FaCalendarAlt className="promo-detail-icon-small" />
              {formatDate(promotion.end_date)}
            </span>
          </div>

          {promotion.description && (
            <div className="promo-detail-row">
              <span className="promo-detail-label">Description:</span>
              <span className="promo-detail-value">
                {promotion.description}
              </span>
            </div>
          )}
        </div>

        <div className="promo-details-footer">
          <button
            onClick={onClose}
            className="promo-details-close-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoDetailsModal;
