import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaPercent, FaDollarSign, FaGift } from 'react-icons/fa';
import './Promotions.css';
import axios from 'axios';
import { formatPrice } from '../../utils/currency';

export default function Promotions() {
  const { isUserAdmin, loadingSettings, currency } = useSettings();
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

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
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPromotions();
      } else {
        const error = await response.json();
        alert(error.message || 'Error deleting promotion');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Error deleting promotion');
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minQuantity: promotion.min_quantity || 1,
      maxQuantity: promotion.max_quantity || null,
      startDate: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      endDate: promotion.end_date ? promotion.end_date.split('T')[0] : '',
      isActive: promotion.is_active,
      applicableProducts: promotion.applicable_products ? JSON.parse(promotion.applicable_products) : [],
      applicableCategories: promotion.applicable_categories ? JSON.parse(promotion.applicable_categories) : [],
      code: promotion.code || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
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
      case 'buy_x_get_y': return <FaGift />;
      default: return <FaPercent />;
    }
  };

  const getPromotionTypeLabel = (type) => {
    switch (type) {
      case 'percentage': return 'Percentage Discount';
      case 'fixed': return 'Fixed Amount Discount';
      case 'buy_x_get_y': return 'Buy X Get Y Free';
      default: return type;
    }
  };

  const formatValue = (type, value) => {
    if (!value) return 'N/A';
    switch (type) {
      case 'percentage': return `${value}%`;
      case 'fixed': return formatPrice(value, currency);
      case 'buy_x_get_y': return `Buy ${value.split(':')[0]} Get ${value.split(':')[1]} Free`;
      default: return value;
    }
  };

  if (loadingSettings) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
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

      {loading ? (
        <div className="loading">Loading promotions...</div>
      ) : (
        <div className="promotions-grid">
          {promotions.map((promotion) => (
            <div key={promotion.promotion_id} className="promotion-card">
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
                  <span className={`status-badge ${promotion.is_active ? 'active' : 'inactive'}`}>
                    {promotion.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="promotion-details">
                <p className="promotion-description">{promotion.description}</p>
                <div className="promotion-dates">
                  <span><FaCalendarAlt /> {new Date(promotion.start_date).toLocaleDateString()}</span>
                  <span>to {new Date(promotion.end_date).toLocaleDateString()}</span>
                </div>
                {promotion.code && (
                  <div className="promotion-code">
                    <strong>Code:</strong> {promotion.code}
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
          ))}
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
              <div className="form-row">
                <div className="form-group">
                  <label>Promotion Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Promotion Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Promotion Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="percentage">Percentage Discount</option>
                    <option value="fixed">Fixed Amount Discount</option>
                    <option value="buy_x_get_y">Buy X Get Y Free</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Value *</label>
                  {formData.type === 'buy_x_get_y' ? (
                    <div className="buy-x-get-y-inputs">
                      <input
                        type="number"
                        placeholder="Buy X"
                        value={formData.value.split(':')[0] || ''}
                        onChange={(e) => {
                          const y = formData.value.split(':')[1] || '1';
                          setFormData({...formData, value: `${e.target.value}:${y}`});
                        }}
                        min="1"
                        required
                      />
                      <span>Get</span>
                      <input
                        type="number"
                        placeholder="Y Free"
                        value={formData.value.split(':')[1] || ''}
                        onChange={(e) => {
                          const x = formData.value.split(':')[0] || '1';
                          setFormData({...formData, value: `${x}:${e.target.value}`});
                        }}
                        min="1"
                        required
                      />
                      <span>Free</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      min="0"
                      step={formData.type === 'percentage' ? '0.01' : '0.01'}
                      required
                    />
                  )}
                </div>
              </div>

              <div className="form-row">
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Quantity</label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Maximum Quantity</label>
                  <input
                    type="number"
                    value={formData.maxQuantity || ''}
                    onChange={(e) => setFormData({...formData, maxQuantity: e.target.value || null})}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Applicable Categories</label>
                <select
                  multiple
                  value={formData.applicableCategories}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({...formData, applicableCategories: selected});
                  }}
                >
                  {categories.map(category => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Applicable Products</label>
                <select
                  multiple
                  value={formData.applicableProducts}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({...formData, applicableProducts: selected});
                  }}
                >
                  {products.map(product => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Active Promotion
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowModal(false);
                  setEditingPromotion(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 