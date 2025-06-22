import React, { useEffect, useState, useCallback } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/currency';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total_orders: 0, pending_orders: 0, processing_orders: 0, shipped_orders: 0, delivered_orders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { isUserAdmin, loadingSettings, currency } = useSettings();
  const navigate = useNavigate();
  
  const processStats = (distribution) => {
    const newStats = { pending_orders: 0, processing_orders: 0, shipped_orders: 0, delivered_orders: 0 };
    let total = 0;
    if (Array.isArray(distribution)) {
      distribution.forEach(item => {
          const key = `${item.status.toLowerCase()}_orders`;
          if (key in newStats) {
              newStats[key] = item.count;
          }
          total += item.count;
      });
    }
    newStats.total_orders = total;
    return newStats;
  };

  const fetchOrdersAndStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [ordersRes, distributionRes] = await Promise.all([
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/order-status-distribution', { headers })
      ]);

      if (!ordersRes.ok || !distributionRes.ok) {
        throw new Error('Failed to fetch orders data');
      }

      const ordersData = await ordersRes.json();
      const distributionData = await distributionRes.json();

      setOrders(ordersData);
      const processedStats = processStats(distributionData);
      setStats(processedStats);

    } catch (err) {
      setError(err.message || 'Failed to fetch orders data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadingSettings) {
      if (isUserAdmin) {
        fetchOrdersAndStats();
      } else {
        navigate('/');
      }
    }
  }, [isUserAdmin, loadingSettings, navigate, fetchOrdersAndStats]);

  const handleStatusChange = async (orderId, newStatus) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      fetchOrdersAndStats();
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    }
  };

  const handleOrderClick = async (orderId) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
       if (!response.ok) {
        throw new Error('Failed to fetch details');
      }
      const data = await response.json();
      setSelectedOrder(data);
      setShowModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch order details.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  if (loading) return <div className="orders-page"><p>Loading orders...</p></div>;
  if (error) return <div className="orders-page"><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Orders</h1>
        <p>Manage customer orders</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-number">{stats.total_orders}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{stats.pending_orders}</p>
        </div>
        <div className="stat-card">
          <h3>Processing</h3>
          <p className="stat-number">{stats.processing_orders}</p>
        </div>
        <div className="stat-card">
          <h3>Delivered</h3>
          <p className="stat-number">{stats.delivered_orders}</p>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.order_id}>
                <td>#{order.order_id}</td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                <td>{order.user_name || order.user_email}</td>
                <td>{formatPrice(order.total_price, currency)}</td>
                <td>
                  <select
                    className={`status-dropdown status-${order.status}`}
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="order-actions">
                  <button onClick={() => handleOrderClick(order.order_id)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="modal-close-button">&times;</button>
            <h2>Order #{selectedOrder.order_id}</h2>
            <p><strong>User:</strong> {selectedOrder.user_name || selectedOrder.user_email || '-'}</p>
            <p><strong>Date:</strong> {new Date(selectedOrder.order_date).toLocaleString()}</p>
            <p><strong>Total:</strong> {formatPrice(selectedOrder.total_price, currency)}</p>
            <h3>Products</h3>
            <ul className="order-products-list">
              {(selectedOrder.products || []).map((item, idx) => (
                <li key={idx}>
                  <span>{item.product_name || item.name} (x{item.quantity})</span>
                  <span>{formatPrice(item.price_at_order * item.quantity, currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 