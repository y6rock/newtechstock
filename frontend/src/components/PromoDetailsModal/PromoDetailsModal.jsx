import React, { useEffect, useState } from 'react';
import { FaTimes, FaTag, FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { formatPriceConverted } from '../../utils/currency';
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && promotion) {
      // Reset state when modal opens
      setApplicableProducts([]);
      setApplicableCategories([]);
      setShowAllProducts(false);
      setShowAllCategories(false);
      setLoadingItems(true);
    } else {
      // Reset state when modal closes
      setApplicableProducts([]);
      setApplicableCategories([]);
      setShowAllProducts(false);
      setShowAllCategories(false);
      setLoadingItems(false);
    }
  }, [isOpen, promotion]);

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
                // Ensure all IDs are numbers (handle string IDs)
                const numericIds = productIds.map(id => parseInt(id)).filter(id => !isNaN(id));
                
                if (numericIds.length > 0) {
                  console.log('Fetching products with IDs:', numericIds);
                  
                  // Fetch products, including inactive ones (for promotions)
                  try {
                    const response = await axios.get('/api/products/by-ids', {
                      params: { ids: numericIds.join(','), includeInactive: 'true' }
                    });
                    
                    const fetchedProducts = response.data || [];
                    console.log('Fetched products:', fetchedProducts);
                    
                    if (fetchedProducts.length === 0) {
                      console.warn('No products found for IDs:', numericIds);
                      // Try fetching all products to see if they exist
                      try {
                        const allProductsResponse = await axios.get('/api/products', {
                          params: { limit: 10000, page: 1 }
                        });
                        const allProducts = allProductsResponse.data || [];
                        console.log('All available products:', allProducts.map(p => ({ id: p.product_id, name: p.name })));
                      } catch (e) {
                        console.error('Error fetching all products for debugging:', e);
                      }
                    }
                    
                    setApplicableProducts(fetchedProducts);
                    
                    // If we still don't have all products, try fetching individually
                    if (fetchedProducts.length < numericIds.length) {
                      const missingIds = numericIds.filter(id => 
                        !fetchedProducts.some(p => p.product_id === id)
                      );
                      console.log('Attempting to fetch missing products individually:', missingIds);
                      
                      // Try fetching each missing product individually (with includeInactive)
                      const individualPromises = missingIds.map(async (id) => {
                        try {
                          const individualResponse = await axios.get(`/api/products/${id}`, {
                            params: { includeInactive: 'true' }
                          });
                          return individualResponse.data;
                        } catch (e) {
                          console.error(`Failed to fetch product ${id}:`, e);
                          return null;
                        }
                      });
                      
                      const individualResults = await Promise.all(individualPromises);
                      const validResults = individualResults.filter(p => p !== null);
                      
                      if (validResults.length > 0) {
                        setApplicableProducts(prev => [...prev, ...validResults.map(p => ({
                          product_id: p.product_id,
                          name: p.name,
                          price: p.price,
                          image: p.image
                        }))]);
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching products:', error);
                    console.error('Error details:', error.response?.data || error.message);
                    // Set empty array so loading state shows
                    setApplicableProducts([]);
                  }
                } else {
                  console.error('No valid numeric product IDs found after parsing');
                }
              }
            } catch (error) {
              console.error('Error parsing product IDs:', error);
              console.error('Raw applicable_products:', promotion.applicable_products);
            }
          }

          // Fetch categories if applicable_categories exists
          if (promotion.applicable_categories) {
            try {
              const categoryIds = JSON.parse(promotion.applicable_categories);
              if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                // Fetch categories, including inactive ones (for promotions)
                const response = await axios.get('/api/categories/by-ids', {
                  params: { ids: categoryIds.join(','), includeInactive: 'true' }
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
        // Value is stored in ILS, convert to current currency
        return `${formatPriceConverted(value, currency)} OFF`;
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

  const renderApplicableItems = (items, type, showAll, setShowAll, promotionField, loadingItems) => {
    // Check if promotion has this type of applicable items
    let hasItems = false;
    let itemIds = [];
    
    try {
      if (promotionField && promotion[promotionField]) {
        const ids = JSON.parse(promotion[promotionField]);
        if (Array.isArray(ids) && ids.length > 0) {
          hasItems = true;
          itemIds = ids;
        }
      }
    } catch (error) {
      console.error(`Error parsing ${promotionField}:`, error);
    }
    
    // Don't render if promotion doesn't have this type of items
    if (!hasItems) return null;
    
    const displayLimit = 3;
    const shouldShowToggle = items.length > displayLimit;
    const itemsToShow = showAll ? items : items.slice(0, displayLimit);

    return (
      <div className="applicable-items-section">
        <div className="applicable-items-header">
          <span className="applicable-items-label">Applies To {type}:</span>
        </div>
        {loadingItems && items.length === 0 ? (
          <div className="applicable-items-loading">Loading {type.toLowerCase()}...</div>
        ) : items.length > 0 ? (
          <>
            <div className="applicable-items-list">
              {itemsToShow.map((item, index) => (
                <span key={item.product_id || item.category_id || item.id || index} className="applicable-item">
                  {item.name || 'Unknown'}
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
          </>
        ) : (
          <div className="applicable-items-list">
            <span className="applicable-item" style={{ color: '#6b7280', fontStyle: 'italic' }}>
              Loading {type.toLowerCase()} names...
            </span>
          </div>
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
          {renderApplicableItems(applicableProducts, 'Products', showAllProducts, setShowAllProducts, 'applicable_products', loadingItems)}

          {/* Applicable Categories */}
          {renderApplicableItems(applicableCategories, 'Categories', showAllCategories, setShowAllCategories, 'applicable_categories', loadingItems)}

          {/* Fallback if no specific items - only show if promotion truly has no applicable items */}
          {(() => {
            // Check if promotion has any applicable products or categories defined
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
            
            // Only show "All items" if promotion has no applicable products AND no applicable categories
            // AND we're not still loading (to avoid showing it prematurely)
            if (!hasApplicableProducts && !hasApplicableCategories && !loadingItems) {
              return (
                <div className="promo-detail-row">
                  <span className="promo-detail-label">Applies To:</span>
                  <span className="promo-detail-value">All items</span>
                </div>
              );
            }
            return null;
          })()}

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
