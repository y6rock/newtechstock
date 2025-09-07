import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaPercent, FaDollarSign } from 'react-icons/fa';
import './Promotions.css';
import axios from 'axios';
import { formatPrice } from '../../utils/currency';
import { formatDate } from '../../utils/dateFormat';

export default function Promotions() {
  const { isUserAdmin, loadingSettings, currency } = useSettings();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [deactivating, setDeactivating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minQuantity: 1,
    maxQuantity: null,
    startDate: '',
    endDate: '',
    isActive: true,
    applicableProducts: [],
    applicableCategories: [],
    code: ''
  });
  const [applyType, setApplyType] = useState('products'); // 'products' or 'categories'

  useEffect(() => {
    if (!loadingSettings && !isUserAdmin) {
      navigate('/');
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  useEffect(() => {
    if (isUserAdmin) {
      fetchPromotions();
      fetchCategories();
      fetchProducts();
    }
  }, [isUserAdmin]);

  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Categories fetched:', data);
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Products fetched:', data);
        setProducts(data);
      } else {
        console.error('Failed to fetch products:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate quantity constraints
    if (formData.maxQuantity && parseInt(formData.maxQuantity) <= parseInt(formData.minQuantity)) {
      alert('Maximum quantity must be greater than minimum quantity.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = editingPromotion 
        ? `/api/promotions/${editingPromotion.promotion_id}`
        : '/api/promotions';
      
      const method = editingPromotion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingPromotion(null);
        resetForm();
        fetchPromotions();
      } else {
        const error = await response.json();
        alert(error.message || 'Error saving promotion');
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Error saving promotion');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/promotions/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          fetchPromotions();
        }
      } catch (error) {
        console.error('Error deleting promotion:', error);
      }
    }
  };

  const handleDeactivateExpired = async () => {
    if (window.confirm('Are you sure you want to deactivate all expired promotions?')) {
      setDeactivating(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/promotions/deactivate-expired', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          alert(result.message);
          fetchPromotions();
        }
      } catch (error) {
        console.error('Error deactivating expired promotions:', error);
        alert('Error deactivating expired promotions');
      } finally {
        setDeactivating(false);
      }
    }
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const getPromotionStatus = (promotion) => {
    if (!promotion.is_active) {
      return { status: 'inactive', label: 'Inactive', className: 'inactive' };
    }
    if (isExpired(promotion.end_date)) {
      return { status: 'expired', label: 'Expired', className: 'expired' };
    }
    if (new Date(promotion.start_date) > new Date()) {
      return { status: 'pending', label: 'Pending', className: 'pending' };
    }
    return { status: 'active', label: 'Active', className: 'active' };
  };


  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    const applicableProducts = promotion.applicable_products ? JSON.parse(promotion.applicable_products) : [];
    const applicableCategories = promotion.applicable_categories ? JSON.parse(promotion.applicable_categories) : [];
    
    // Determine apply type based on existing data
    const newApplyType = applicableProducts.length > 0 ? 'products' : 'categories';
    setApplyType(newApplyType);
    
    setFormData({
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minQuantity: promotion.min_quantity || 1,
      maxQuantity: promotion.max_quantity || null,
      startDate: promotion.start_date, // Store in YYYY-MM-DD format for backend
      endDate: promotion.end_date, // Store in YYYY-MM-DD format for backend
      isActive: promotion.is_active,
      applicableProducts: applicableProducts,
      applicableCategories: applicableCategories,
      code: promotion.code || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setApplyType('products');
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minQuantity: 1,
      maxQuantity: null,
      startDate: '',
      endDate: '',
      isActive: true,
      applicableProducts: [],
      applicableCategories: [],
      code: ''
    });
  };

  const getPromotionTypeIcon = (type) => {
    switch (type) {
      case 'percentage': return <FaPercent />;
      case 'fixed': return <FaDollarSign />;
      default: return <FaPercent />;
    }
  };

  const getPromotionTypeLabel = (type) => {
    switch (type) {
      case 'percentage': return 'Percentage Discount';
      case 'fixed': return 'Fixed Amount Discount';
      default: return type;
    }
  };

  const formatValue = (type, value) => {
    if (!value) return 'N/A';
    switch (type) {
      case 'percentage': return `${value}%`;
      case 'fixed': return formatPrice(value, currency);
      default: return value;
    }
  };

  if (loadingSettings) {
    return (
      <div className="promotions-loading-container">
        <div className="promotions-loading-content">
          <p>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  return (
    <div className="promotions-container">
      <div className="promotions-header">
        <h1>Promotions & Discounts</h1>
        <div className="promotions-actions">
          <button 
            className="deactivate-expired-btn"
            onClick={handleDeactivateExpired}
            disabled={deactivating}
          >
            {deactivating ? 'Deactivating...' : 'Deactivate Expired'}
          </button>
          <button 
            className="add-promotion-btn"
            onClick={() => {
              setEditingPromotion(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <FaPlus /> Add Promotion
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading promotions...</div>
      ) : (
        <div className="promotions-grid">
          {promotions.map((promotion) => {
            const status = getPromotionStatus(promotion);
            return (
              <div key={promotion.promotion_id} className={`promotion-card ${status.className}`}>
                <div className="promotion-header">
                  <div className="promotion-type-icon">
                    {getPromotionTypeIcon(promotion.type)}
                  </div>
                  <div className="promotion-info">
                    <h3>{promotion.name}</h3>
                    <p className="promotion-type">{getPromotionTypeLabel(promotion.type)}</p>
                    <p className="promotion-value">{formatValue(promotion.type, promotion.value)}</p>
                  </div>
                  <div className="promotion-status">
                    <span className={`status-badge ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                
                <div className="promotion-details">
                  <p className="promotion-description">{promotion.description}</p>
                  <div className="promotion-dates">
                    <span><FaCalendarAlt /> {formatDate(promotion.start_date)}</span>
                    <span>to {formatDate(promotion.end_date)}</span>
                    {isExpired(promotion.end_date) && (
                      <span className="expired-indicator">(Expired)</span>
                    )}
                  </div>
                  {promotion.code && (
                    <div className="promotion-code">
                      <strong>Code:</strong> {promotion.code}
                    </div>
                  )}
                  <div className="promotion-quantity-requirements">
                    <strong>Quantity:</strong> 
                    {promotion.min_quantity > 1 && ` Min: ${promotion.min_quantity}`}
                    {promotion.max_quantity && ` Max: ${promotion.max_quantity}`}
                    {(!promotion.min_quantity || promotion.min_quantity <= 1) && !promotion.max_quantity && ' No restrictions'}
                  </div>
                  
                  {/* Show applicable products or categories */}
                  {promotion.applicable_products && JSON.parse(promotion.applicable_products).length > 0 && (
                    <div className="promotion-applicable">
                      <strong>Applies to Products:</strong>
                      <div className="applicable-items">
                        {JSON.parse(promotion.applicable_products).map(productId => {
                          const product = products.find(p => p.product_id === productId);
                          return product ? (
                            <span key={productId} className="applicable-item">
                              {product.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {promotion.applicable_categories && JSON.parse(promotion.applicable_categories).length > 0 && (
                    <div className="promotion-applicable">
                      <strong>Applies to Categories:</strong>
                      <div className="applicable-items">
                        {JSON.parse(promotion.applicable_categories).map(categoryId => {
                          const category = categories.find(c => c.category_id === categoryId);
                          return category ? (
                            <span key={categoryId} className="applicable-item">
                              {category.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="promotion-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(promotion)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(promotion.promotion_id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingPromotion ? 'Edit Promotion' : 'Add New Promotion'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingPromotion(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="promotion-form">
              <div className="form-group">
                <label>Promotion Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Summer Sale 20% Off"
                  required
                />
              </div>

              <div className="form-group">
                <label>Promotion Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g., SUMMER20"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your promotion..."
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Discount Type *</label>
                <div className="promotion-type-selector">
                  <label className={`type-option ${formData.type === 'percentage' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="percentage"
                      checked={formData.type === 'percentage'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    />
                    <span className="type-option-icon">💯</span>
                    <span className="type-option-label">%</span>
                  </label>
                  
                  <label className={`type-option ${formData.type === 'fixed' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="fixed"
                      checked={formData.type === 'fixed'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    />
                    <span className="type-option-icon">💰</span>
                    <span className="type-option-label">$</span>
                  </label>
                  
                </div>
              </div>

              <div className="form-group">
                <label>Discount Value *</label>
                <div className="value-input-container">
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    min="0"
                    step="0.01"
                    placeholder={formData.type === 'percentage' ? '20' : '10'}
                    required
                  />
                  <span className="value-suffix">
                    {formData.type === 'percentage' ? '%' : currency}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Min Quantity *</label>
                <input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
                  min="1"
                  placeholder="1"
                  required
                />
                <small className="form-help-text">
                  Minimum quantity required per item to apply this promotion
                </small>
              </div>

              <div className="form-group">
                <label>Max Quantity</label>
                <input
                  type="number"
                  value={formData.maxQuantity || ''}
                  onChange={(e) => setFormData({...formData, maxQuantity: e.target.value || null})}
                  min="1"
                  placeholder="No limit"
                />
                <small className="form-help-text">
                  Maximum quantity allowed per item (leave empty for no limit)
                </small>
              </div>

              <div className="form-group">
                <label>Apply To</label>
                <div className="promotion-apply-selector">
                  <label className={`apply-option ${applyType === 'products' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="applyType"
                      value="products"
                      checked={applyType === 'products'}
                      onChange={() => {
                        setApplyType('products');
                        setFormData({
                          ...formData,
                          applicableProducts: [],
                          applicableCategories: []
                        });
                      }}
                    />
                    <span className="apply-option-icon">📦</span>
                    <span className="apply-option-label">Specific Products</span>
                  </label>
                  
                  <label className={`apply-option ${applyType === 'categories' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="applyType"
                      value="categories"
                      checked={applyType === 'categories'}
                      onChange={() => {
                        setApplyType('categories');
                        setFormData({
                          ...formData,
                          applicableProducts: [],
                          applicableCategories: []
                        });
                      }}
                    />
                    <span className="apply-option-icon">📂</span>
                    <span className="apply-option-label">Categories</span>
                  </label>
                </div>
                <small className="form-help-text-block">
                  Select whether this promotion applies to specific products or entire categories
                </small>
              </div>

              {applyType === 'products' && (
                <div className="form-group">
                  <label>Select Products</label>
                  <div className="multi-select-container">
                    {products.length === 0 ? (
                      <div className="empty-state">
                        No products available. Loading...
                      </div>
                    ) : (
                      products.map(product => (
                        <label key={product.product_id} className="multi-select-item">
                          <input
                            type="checkbox"
                            checked={formData.applicableProducts.includes(product.product_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  applicableProducts: [...formData.applicableProducts, product.product_id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  applicableProducts: formData.applicableProducts.filter(id => id !== product.product_id)
                                });
                              }
                            }}
                          />
                          <span className="multi-select-label">{product.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {applyType === 'categories' && (
                <div className="form-group">
                  <label>Select Categories</label>
                  <div className="multi-select-container">
                    {categories.length === 0 ? (
                      <div className="empty-state">
                        No categories available. Loading...
                      </div>
                    ) : (
                      categories.map(category => (
                        <label key={category.category_id} className="multi-select-item">
                          <input
                            type="checkbox"
                            checked={formData.applicableCategories.includes(category.category_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  applicableCategories: [...formData.applicableCategories, category.category_id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  applicableCategories: formData.applicableCategories.filter(id => id !== category.category_id)
                                });
                              }
                            }}
                          />
                          <span className="multi-select-label">{category.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Active Promotion</label>
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className="checkbox-label">Enable this promotion</span>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingPromotion ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 