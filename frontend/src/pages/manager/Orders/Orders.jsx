import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../../utils/currency';
import { formatDate, formatDateTime } from '../../../utils/dateFormat';
import Pagination from '../../../components/Pagination/Pagination';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total_orders: 0, pending_orders: 0, processing_orders: 0, shipped_orders: 0, delivered_orders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [sortField, setSortField] = useState('order_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
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


  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };



  // Auto-refocus search input after re-renders to maintain typing experience
  useEffect(() => {
    if (searchInputRef.current && searchTerm) {
      searchInputRef.current.focus();
    }
  });

  // Ref-based search implementation - no re-renders during typing
  useEffect(() => {
    if (!isUserAdmin || loadingSettings) {
      if (!loadingSettings && !isUserAdmin) {
        navigate('/');
      }
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const ordersUrl = `/api/admin/orders?page=${pagination.currentPage}&limit=10${searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : ''}`;
        const [ordersRes, distributionRes] = await Promise.all([
          fetch(ordersUrl, { headers }),
          fetch('/api/admin/order-status-distribution', { headers })
        ]);

        if (!ordersRes.ok || !distributionRes.ok) {
          throw new Error('Failed to fetch orders data');
        }

        const ordersData = await ordersRes.json();
        const distributionData = await distributionRes.json();

        // Handle both old format (array) and new format (object with orders array)
        const orders = ordersData.orders || ordersData;
        const paginationData = ordersData.pagination || { currentPage: 1, totalPages: 1, totalItems: orders.length, itemsPerPage: 10 };
        
        setOrders(orders);
        setPagination(paginationData);
        const processedStats = processStats(distributionData);
        setStats(processedStats);

      } catch (err) {
        setError(err.message || 'Failed to fetch orders data.');
      } finally {
        setLoading(false);
      }
    }, searchTerm.trim() ? 300 : 0); // Debounce only when searching

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isUserAdmin, loadingSettings, navigate]);

  // Handle page changes - inline fetch to avoid dependency issues
  const handlePageChange = useCallback(async (newPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const ordersUrl = `/api/admin/orders?page=${newPage}&limit=10${searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : ''}`;
      const [ordersRes, distributionRes] = await Promise.all([
        fetch(ordersUrl, { headers }),
        fetch('/api/admin/order-status-distribution', { headers })
      ]);

      if (!ordersRes.ok || !distributionRes.ok) {
        throw new Error(`HTTP error! status: ${ordersRes.status}`);
      }

      const [ordersData, distributionData] = await Promise.all([
        ordersRes.json(),
        distributionRes.json()
      ]);

      setOrders(ordersData.orders || ordersData);
      setStats(distributionData);
      
      if (ordersData.pagination) {
        setPagination(ordersData.pagination);
      } else {
        setPagination(prev => ({
          ...prev,
          currentPage: newPage
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch orders data.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Handle search input changes - simple state update like Customers
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
  }, []);


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
      
      // Refresh the orders data after status update
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const ordersUrl = `/api/admin/orders?page=${pagination.currentPage}&limit=10${searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : ''}`;
      const [ordersRes, distributionRes] = await Promise.all([
        fetch(ordersUrl, { headers }),
        fetch('/api/admin/order-status-distribution', { headers })
      ]);

      if (!ordersRes.ok || !distributionRes.ok) {
        throw new Error('Failed to refresh orders data');
      }

      const [ordersData, distributionData] = await Promise.all([
        ordersRes.json(),
        distributionRes.json()
      ]);

      setOrders(ordersData.orders || ordersData);
      const processedStats = processStats(distributionData);
      setStats(processedStats);
      
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
  if (error) return <div className="orders-page"><p className="orders-error">{error}</p></div>;

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

      <div className="orders-filters">
        {/* Main filters row */}
        <div className="filter-row main-filters">
        </div>
        
        {/* Search row */}
        <div className="filter-row search-row">
          <div className="filter-group search-group" style={{ position: 'relative' }}>
            <input
              id="search-term"
              type="text"
              placeholder="Search by name, email, or order ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              ref={searchInputRef}
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
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th 
                className={`sortable ${sortField === 'order_id' ? 'active' : ''}`}
                onClick={() => handleSort('order_id')}
              >
                Order ID
                <span className="sort-arrow">
                  {sortField === 'order_id' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'order_date' ? 'active' : ''}`}
                onClick={() => handleSort('order_date')}
              >
                Date
                <span className="sort-arrow">
                  {sortField === 'order_date' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'customer_name' ? 'active' : ''}`}
                onClick={() => handleSort('customer_name')}
              >
                Customer
                <span className="sort-arrow">
                  {sortField === 'customer_name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'total_amount' ? 'active' : ''}`}
                onClick={() => handleSort('total_amount')}
              >
                Total
                <span className="sort-arrow">
                  {sortField === 'total_amount' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'status' ? 'active' : ''}`}
                onClick={() => handleSort('status')}
              >
                Status
                <span className="sort-arrow">
                  {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.order_id}>
                <td>#{order.order_id}</td>
                <td>{formatDate(order.order_date)}</td>
                <td>{order.customer_name || order.customer_email}</td>
                <td>{formatPrice(order.total_amount, currency)}</td>
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

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        onPageChange={handlePageChange}
      />

      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="modal-close-button">&times;</button>
            <h2>Order #{selectedOrder.order_id}</h2>
            <p><strong>User:</strong> {selectedOrder.user_name || selectedOrder.user_email || '-'}</p>
            <p><strong>Date:</strong> {formatDateTime(selectedOrder.order_date)}</p>
            <p><strong>Total:</strong> {formatPrice(selectedOrder.total_price, currency)}</p>
            {selectedOrder.promotion_code && (
              <p><strong>Promotion:</strong> <span className="promotion-badge">{selectedOrder.promotion_code}</span></p>
            )}
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
