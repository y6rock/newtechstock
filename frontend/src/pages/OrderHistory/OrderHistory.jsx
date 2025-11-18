import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate, Link } from 'react-router-dom';
import { formatPriceWithTax, formatPriceConverted } from '../../utils/currency';
import { formatDateTimeFull } from '../../utils/dateFormat';
import Pagination from '../../components/Pagination/Pagination';
import './OrderHistory.css';

const OrderHistory = ({ userId }) => {
  const { user_id: contextUserId, loadingSettings, currency, vat_rate } = useSettings();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });

  // Use the userId prop if provided, otherwise fallback to contextUserId
  const currentUserId = userId || contextUserId;

  const fetchOrders = async (page = 1) => {
    if (loadingSettings) {
      // Still loading settings, wait for user_id to be available
      return;
    }
    if (!currentUserId) {
      // If not logged in, redirect to login page (only if not getting userId via prop)
      if (!userId) { // Only navigate if this is the top-level OrderHistory page
        alert('Please log in to view your order history.');
        navigate('/login');
      }
      return;
    }

    setLoadingOrders(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      // API call with pagination
      const response = await fetch(`/api/orders/history/${currentUserId}?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
        throw new Error(errorData.message || 'Failed to fetch orders.');
      }
      const data = await response.json();
      
      // Handle both old format (array) and new format (object with orders and pagination)
      const ordersArray = Array.isArray(data) ? data : (data.orders || []);
      const paginationData = data.pagination || { currentPage: 1, totalPages: 1, totalItems: ordersArray.length, itemsPerPage: 10 };
      
      // Sort orders by date (newest first)
      const sortedOrders = ordersArray.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
      
      setOrders(sortedOrders);
      setPagination(paginationData);
      console.log('Fetched orders:', sortedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(`Failed to load orders: ${err.message}`);
      setOrders([]); // Defensive: always set to array
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [currentUserId, loadingSettings, navigate, userId]);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage);
  };

  if (loadingOrders) {
    return <div className="loading">Loading order history...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Defensive: only map if orders is an array
  if (!Array.isArray(orders)) {
    return <div className="error">Failed to load orders: Unexpected response format.</div>;
  }

  // Check if this is being used as a standalone page (no userId prop)
  const isStandalonePage = !userId;

  return (
    <div className={isStandalonePage ? "order-history-container" : ""}>
      {isStandalonePage ? (
        <>
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <div className="tab-container">
              <button
                onClick={() => navigate('/profile')}
                className="tab-button inactive"
              >
                Profile
              </button>
              <button className="tab-button active">
                Order History
              </button>
            </div>
          </div>
          {/* Order History Content */}
          <div className="order-history-content">
            <div className="order-history-header">
              <h1 className="order-history-title">Your Order History</h1>
              <p className="order-history-subtitle">Track all your past orders and their status</p>
            </div>
          </div>
        </>
      ) : (
        <h2 className="order-history-embedded-title">Your Order History</h2>
      )}

      <div className={isStandalonePage ? "order-history-content" : ""}>
        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h2 className="no-orders-title">No Orders Yet</h2>
            <p className="no-orders-text">You haven't placed any orders yet. Start shopping to see your order history here!</p>
            <Link to="/products" className="shop-now-btn">Start Shopping</Link>
          </div>
        ) : (
          <div>
            {orders.map(order => (
              <div key={order.order_id} className="order-card">
                <div className="order-header">
                  <h2 className="order-number">Order #{order.order_id}</h2>
                  <span className="order-total">Total: {formatPriceConverted(order.total_amount, currency)}</span>
                </div>
                <div className="order-details">
                  <p className="order-detail">Date: {formatDateTimeFull(order.order_date)}</p>
                  <p className="order-detail">Status: <span className={`order-status ${order.status}`}>{order.status}</span></p>
                  {order.promotion_code && (
                    <p className="order-detail">Promotion: <span className="promotion-badge">{order.promotion_code}</span></p>
                  )}
                  {order.promotion_id && !order.promotion_code && (
                    <p className="order-detail">Promotion: <span className="promotion-badge">Deleted Promotion (ID: {order.promotion_id})</span></p>
                  )}
                </div>

                <div className="items-section">
                  <h3 className="items-title">Items:</h3>
                  <div className="items-list">
                    {(Array.isArray(order.items) ? order.items : []).map(item => {
                      const unitPrice = parseFloat(item.price) || 0;
                      const quantity = item.quantity || 1;
                      const totalBeforeDiscount = unitPrice * quantity;
                      const discount = item.discount || 0;
                      const totalAfterDiscount = item.price_after_discount || totalBeforeDiscount;
                      const hasDiscount = discount > 0;
                      const discountPercentage = order.promotion_type === 'percentage' && order.promotion_value 
                        ? parseFloat(order.promotion_value) 
                        : hasDiscount ? ((discount / totalBeforeDiscount) * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={item.product_id} className="item-card">
                          <img 
                            src={item.product_image && item.product_image.startsWith('/uploads') ? `http://localhost:3001${item.product_image}` : item.product_image || 'https://via.placeholder.com/50'} 
                            alt={item.product_name} 
                            className="item-image"
                          />
                          <div className="item-details">
                            <p className="item-name">{item.product_name}</p>
                            <p className="item-quantity">Quantity: {quantity}</p>
                            <div className="item-pricing">
                              <div className="price-line">
                                <span className="price-label">Unit Price:</span>
                                <span>{formatPriceWithTax(unitPrice, currency, vat_rate)}</span>
                              </div>
                              <div className="price-line">
                                <span className="price-label">Total:</span>
                                <span>{formatPriceWithTax(totalBeforeDiscount, currency, vat_rate)}</span>
                              </div>
                              {hasDiscount && (
                                <>
                                  <div className="price-line discount-info">
                                    <span className="price-label">Discount:</span>
                                    <span className="discount-amount">-{formatPriceWithTax(discount, currency, vat_rate)}</span>
                                    {order.promotion_code && (
                                      <span className="discount-code">({discountPercentage}% - {order.promotion_code})</span>
                                    )}
                                    {!order.promotion_code && order.promotion_id && (
                                      <span className="discount-code">({discountPercentage}% - Deleted)</span>
                                    )}
                                  </div>
                                  <div className="price-line final-price">
                                    <span className="price-label">After Discount:</span>
                                    <span className="price-value">{formatPriceWithTax(totalAfterDiscount, currency, vat_rate)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default OrderHistory; 