import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaPercent, FaDollarSign } from 'react-icons/fa';
import Pagination from '../../../components/Pagination/Pagination';
import './Promotions.css';
import { formatPrice } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateFormat';

export default function Promotions() {
  const { isUserAdmin, loadingSettings, currency } = useSettings();
  const { showSuccess, showError, showConfirm } = useToast();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active'); // Filter state - default to active
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Fetch promotions function
  const fetchPromotions = useCallback(async (searchQuery = '', page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const url = `/api/promotions?page=${page}&limit=10${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Handle both old format (array) and new format (object with promotions array)
        const promotionsData = data.promotions || data;
        const paginationData = data.pagination || { currentPage: 1, totalPages: 1, totalItems: promotionsData.length, itemsPerPage: 10 };
        
        setPromotions(Array.isArray(promotionsData) ? promotionsData : []);
        setPagination(paginationData);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadingSettings && !isUserAdmin) {
      navigate('/');
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  // Initial load
  useEffect(() => {
    if (isUserAdmin) {
      const page = parseInt(searchParams.get('page')) || 1;
      const search = searchParams.get('search') || '';
      setSearchTerm(search);
      fetchPromotions(search, page);
      fetchCategories();
      fetchProducts();
    }
  }, [isUserAdmin, fetchPromotions]);

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
    fetchPromotions(searchTerm, newPage);
  }, [searchParams, setSearchParams, searchTerm, fetchPromotions]);

  // Handle search changes with debouncing - only updates state, not URL
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    // Don't update URL params here - let the debounced effect handle it
    // This prevents the input from losing focus on every keystroke
  }, []);

  // Debounced search effect - optimized to prevent input focus loss
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isUserAdmin && searchTerm.trim()) {
        // Only perform search if there's actually a search term
        fetchPromotions(searchTerm, 1);
      } else if (isUserAdmin && !searchTerm.trim()) {
        // Clear search - fetch all promotions
        fetchPromotions('', 1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, isUserAdmin, fetchPromotions]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Categories fetched:', data);
        // Handle both old format (array) and new format (object with categories array)
        const categoriesData = data.categories || data;
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
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
        // Handle both old format (array) and new format (object with products array)
        const productsData = data.products || data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        console.error('Failed to fetch products:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate discount value - cannot be negative for fixed type
    if (formData.type === 'fixed') {
      const value = parseFloat(formData.value);
      if (isNaN(value) || value < 0) {
        showError('Discount value cannot be negative for fixed amount promotions.');
        return;
      }
    }
    
    // Validate quantity constraints
    if (formData.maxQuantity && parseInt(formData.maxQuantity) <= parseInt(formData.minQuantity)) {
      showError('Maximum quantity must be greater than minimum quantity.');
      return;
    }
    
    // Validate date constraints
    const today = new Date().toISOString().split('T')[0];
    if (formData.startDate < today) {
      showError('Start date cannot be in the past.');
      return;
    }
    
    if (formData.endDate <= formData.startDate) {
      showError('End date must be after the start date.');
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
        const successMessage = editingPromotion ? 'Promotion updated successfully!' : 'Promotion created successfully!';
        showSuccess(successMessage);
        setShowModal(false);
        setEditingPromotion(null);
        resetForm();
        const currentPage = searchParams.get('page') || 1;
        const currentSearch = searchParams.get('search') || '';
        fetchPromotions(currentSearch, currentPage);
      } else {
        const error = await response.json();
        showError(error.message || 'Error saving promotion');
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      showError('Error saving promotion');
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this promotion? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/promotions/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const currentPage = searchParams.get('page') || 1;
            const currentSearch = searchParams.get('search') || '';
            fetchPromotions(currentSearch, currentPage);
            showSuccess('Promotion deleted successfully!');
          } else {
            showError('Failed to delete promotion.');
          }
        } catch (error) {
          console.error('Error deleting promotion:', error);
          showError('Failed to delete promotion.');
        }
      },
      () => {
        // Cancel callback - do nothing
      }
    );
  };


  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const getPromotionStatus = (promotion) => {
    // Check expired first (based on end_date, regardless of is_active)
    if (isExpired(promotion.end_date)) {
      return { status: 'expired', label: 'Expired', className: 'expired' };
    }
    // Then check if manually deactivated
    if (!promotion.is_active) {
      return { status: 'inactive', label: 'Inactive', className: 'inactive' };
    }
    // Check if pending (not started yet)
    if (new Date(promotion.start_date) > new Date()) {
      return { status: 'pending', label: 'Pending', className: 'pending' };
    }
    // Otherwise it's active
    return { status: 'active', label: 'Active', className: 'active' };
  };


  // Helper function to convert date to YYYY-MM-DD format for HTML date inputs
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
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
      startDate: formatDateForInput(promotion.start_date), // Convert to YYYY-MM-DD format for HTML input
      endDate: formatDateForInput(promotion.end_date), // Convert to YYYY-MM-DD format for HTML input
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
      case 'percentage': return `${value}% OFF`;
      case 'fixed': return `${formatPrice(value, currency)} OFF`;
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

      {/* Search and Status Filter */}
      <div className="promotions-filters">
        <div className="search-container" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search promotions by name, description, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '14px 20px 14px 55px',
              border: '2px solid #e1e5e9',
              borderRadius: '12px',
              fontSize: '16px',
              backgroundColor: '#ffffff',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            🔍
          </span>
        </div>
        <div className="status-filters">
          <button 
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
        <button 
          className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          Active
        </button>
        <button 
          className={`filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
          onClick={() => setStatusFilter('inactive')}
        >
          Inactive
        </button>
          <button 
            className={`filter-btn ${statusFilter === 'expired' ? 'active' : ''}`}
            onClick={() => setStatusFilter('expired')}
          >
            Expired
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading promotions...</div>
      ) : (
        (() => {
          const filteredPromotions = promotions
            .filter((promotion) => {
              if (statusFilter === 'all') return true;
              const status = getPromotionStatus(promotion);
              if (statusFilter === 'inactive') {
                return !promotion.is_active;
              }
              return status.status === statusFilter;
            })
            .sort((a, b) => {
              // Sort active promotions first, then by start date
              const statusA = getPromotionStatus(a);
              const statusB = getPromotionStatus(b);
              if (statusA.status === 'active' && statusB.status !== 'active') return -1;
              if (statusA.status !== 'active' && statusB.status === 'active') return 1;
              return new Date(b.start_date) - new Date(a.start_date);
            });

          if (filteredPromotions.length === 0) {
            const labelMap = {
              all: 'promotions',
              active: 'active promotions',
              inactive: 'inactive promotions',
              expired: 'expired promotions',
              pending: 'pending promotions'
            };
            const label = labelMap[statusFilter] || 'promotions';
            return (
              <div className="empty-state" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                No {label} found.
              </div>
            );
          }

          return (
            <div className="promotions-grid">
              {filteredPromotions.map((promotion) => {
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
                    <div className="promotion-value-container">
                      <span className="promotion-value-label">Discount:</span>
                      <span className="promotion-value">{formatValue(promotion.type, promotion.value)}</span>
                    </div>
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
          );
        })()
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
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // For fixed type, ensure value cannot be negative
                      if (formData.type === 'fixed' && inputValue !== '' && parseFloat(inputValue) < 0) {
                        return; // Don't update if negative for fixed type
                      }
                      setFormData({...formData, value: inputValue});
                    }}
                    min={formData.type === 'fixed' ? '0' : undefined}
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
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
                <small className="form-help-text">
                  Start date cannot be in the past
                </small>
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
                <small className="form-help-text">
                  End date must be after the start date
                </small>
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
                  <small className="form-help-text">
                    Select multiple products that this promotion applies to
                  </small>
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
                    id="enable-promotion"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <label htmlFor="enable-promotion" className="checkbox-label">Enable this promotion</label>
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

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
