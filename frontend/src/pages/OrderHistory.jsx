import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useNavigate, Link } from 'react-router-dom';
import { formatPrice } from '../utils/currency';
import { formatDateTimeFull } from '../utils/dateFormat';
import './OrderHistory.css';

const OrderHistory = ({ userId }) => {
  const { user_id: contextUserId, loadingSettings, currency } = useSettings();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);

  // Use the userId prop if provided, otherwise fallback to contextUserId
  const currentUserId = userId || contextUserId;

  useEffect(() => {
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

    const fetchOrders = async () => {
      setLoadingOrders(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        // Corrected API call to include /history/:userId
        const response = await fetch(`/api/orders/history/${currentUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
          throw new Error(errorData.message || 'Failed to fetch orders.');
        }
        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : [];
        
        // Sort orders by date (newest first)
        const sortedOrders = ordersArray.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
        
        setOrders(sortedOrders);
        console.log('Fetched orders:', sortedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(`Failed to load orders: ${err.message}`);
        setOrders([]); // Defensive: always set to array
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [currentUserId, loadingSettings, navigate, userId]);

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
    <div className={isStandalonePage ? "order-history-page" : ""}>
      {isStandalonePage ? (
        <div className="order-history-header">
          <h1 className="order-history-title">Your Order History</h1>
          <p className="order-history-subtitle">Track all your past orders and their status</p>
        </div>
      ) : (
        <h2 style={{ fontSize: '1.5em', marginBottom: '20px', textAlign: 'center', color: '#333' }}>Your Order History</h2>
      )}

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
                <span className="order-total">Total: {formatPrice(order.total_amount, currency)}</span>
              </div>
              <div className="order-details">
                <p className="order-detail">Date: {formatDateTimeFull(order.order_date)}</p>
                <p className="order-detail">Status: <span className={`order-status ${order.status}`}>{order.status}</span></p>
              </div>

              <div className="items-section">
                <h3 className="items-title">Items:</h3>
                <div className="items-list">
                  {(Array.isArray(order.items) ? order.items : []).map(item => (
                    <div key={item.product_id} className="item-card">
                      <img 
                        src={item.product_image && item.product_image.startsWith('/uploads') ? `http://localhost:3001${item.product_image}` : item.product_image || 'https://via.placeholder.com/50'} 
                        alt={item.product_name} 
                        className="item-image"
                      />
                      <div className="item-details">
                        <p className="item-name">{item.product_name}</p>
                        <p className="item-quantity">Quantity: {item.quantity}</p>
                        <p className="item-price">{formatPrice(item.price * item.quantity, currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory; 