import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'processing', 'shipped', 'delivered'
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const { isUserAdmin, loadingSettings, currency } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
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


  // Sync sort state from URL for UI display
  useEffect(() => {
    const urlSortField = searchParams.get('sortField');
    const urlSortDirection = searchParams.get('sortDirection');
    if (urlSortField) {
      setSortField(urlSortField);
      setSortDirection(urlSortDirection === 'desc' ? 'desc' : 'asc');
    }
  }, [searchParams]);

  // Sorting function - URL is the single source of truth
  const handleSort = (field) => {
    const urlSortField = searchParams.get('sortField');
    const urlSortDirection = searchParams.get('sortDirection') || 'desc';
    const currentField = urlSortField || sortField;
    
    const isSameField = currentField === field;
    const nextDirection = isSameField ? (urlSortDirection === 'asc' ? 'desc' : 'asc') : 'asc';

    // Update URL only (sortField/sortDirection will be synced from URL for UI display)
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (searchTerm) params.set('search', searchTerm); else params.delete('search');
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter); else params.delete('status');
    params.set('sortField', field);
    params.set('sortDirection', nextDirection);
    setSearchParams(params);
    // Rely on URL sync effect to trigger refetch
  };

  // Render server-sorted orders directly



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

        // Read page from URL (single source of truth)
        const urlPage = parseInt(searchParams.get('page')) || 1;

        const params = new URLSearchParams({
          page: urlPage.toString(),
          limit: '10'
        });
        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        // Sorting from URL only (single source of truth)
        const urlSortField = searchParams.get('sortField');
        const urlSortDirection = searchParams.get('sortDirection');
        if (urlSortField && urlSortDirection) {
          params.append('sortField', urlSortField);
          params.append('sortDirection', urlSortDirection);
        }
        const ordersUrl = `/api/admin/orders?${params.toString()}`;
        const distributionUrl = `/api/admin/order-status-distribution?${params.toString()}`;
        const [ordersRes, distributionRes] = await Promise.all([
          fetch(ordersUrl, { headers }),
          fetch(distributionUrl, { headers })
        ]);

        if (!ordersRes.ok || !distributionRes.ok) {
          throw new Error('Failed to fetch orders data');
        }

        const ordersData = await ordersRes.json();
        const distributionData = await distributionRes.json();

        // Handle both old format (array) and new format (object with orders array)
        const orders = ordersData.orders || ordersData;
        const paginationData = ordersData.pagination || { 
          currentPage: urlPage, 
          totalPages: 1, 
          totalItems: orders.length, 
          itemsPerPage: 10 
        };
        
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
  }, [searchTerm, statusFilter, isUserAdmin, loadingSettings, navigate, searchParams]);

  // Handle page changes - inline fetch to avoid dependency issues
  const handlePageChange = useCallback(async (newPage) => {
    // Update URL parameters for pagination
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter);
    } else {
      params.delete('status');
    }
    // Keep sort in URL (use existing URL values only)
    const existingUrlSortField = searchParams.get('sortField');
    const existingUrlSortDirection = searchParams.get('sortDirection');
    if (existingUrlSortField && existingUrlSortDirection) {
      params.set('sortField', existingUrlSortField);
      params.set('sortDirection', existingUrlSortDirection);
    }
    setSearchParams(params);

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

      const fetchParams = new URLSearchParams({
        page: newPage.toString(),
        limit: '10'
      });
      if (searchTerm.trim()) {
        fetchParams.append('search', searchTerm.trim());
      }
      if (statusFilter && statusFilter !== 'all') {
        fetchParams.append('status', statusFilter);
      }
      // Sorting from URL only (single source of truth)
      if (existingUrlSortField && existingUrlSortDirection) {
        fetchParams.append('sortField', existingUrlSortField);
        fetchParams.append('sortDirection', existingUrlSortDirection);
      }
      const ordersUrl = `/api/admin/orders?${fetchParams.toString()}`;
      const distributionUrl = `/api/admin/order-status-distribution?${fetchParams.toString()}`;
      const [ordersRes, distributionRes] = await Promise.all([
        fetch(ordersUrl, { headers }),
        fetch(distributionUrl, { headers })
      ]);

      if (!ordersRes.ok || !distributionRes.ok) {
        throw new Error(`HTTP error! status: ${ordersRes.status}`);
      }

      const [ordersData, distributionData] = await Promise.all([
        ordersRes.json(),
        distributionRes.json()
      ]);

      const ordersArray = ordersData.orders || ordersData;
      setOrders(ordersArray);
      
      // Process stats properly
      const processedStats = processStats(distributionData);
      setStats(processedStats);
      
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
  }, [searchTerm, statusFilter, searchParams, setSearchParams]);

  // Handle search input changes - simple state update like Customers
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on search
  }, []);
  
  // Handle status filter changes
  const handleStatusFilterChange = useCallback((newStatus) => {
    setStatusFilter(newStatus);
    
    // Update URL to persist filter and preserve sort
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (newStatus && newStatus !== 'all') {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    // Keep sort in URL (use existing URL values only)
    const existingUrlSortField = searchParams.get('sortField');
    const existingUrlSortDirection = searchParams.get('sortDirection');
    if (existingUrlSortField && existingUrlSortDirection) {
      params.set('sortField', existingUrlSortField);
      params.set('sortDirection', existingUrlSortDirection);
    }
    setSearchParams(params);
  }, [searchTerm, searchParams, setSearchParams]);


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
      
      // Read page and sort from URL (single source of truth)
      const urlPage = parseInt(searchParams.get('page')) || pagination.currentPage;
      const urlSortField = searchParams.get('sortField');
      const urlSortDirection = searchParams.get('sortDirection');
      
      const ordersParams = new URLSearchParams({
        page: urlPage.toString(),
        limit: '10'
      });
      if (searchTerm.trim()) {
        ordersParams.append('search', searchTerm.trim());
      }
      if (statusFilter && statusFilter !== 'all') {
        ordersParams.append('status', statusFilter);
      }
      if (urlSortField && urlSortDirection) {
        ordersParams.append('sortField', urlSortField);
        ordersParams.append('sortDirection', urlSortDirection);
      }
      const ordersUrl = `/api/admin/orders?${ordersParams.toString()}`;
      
      const distributionParams = new URLSearchParams();
      if (searchTerm.trim()) {
        distributionParams.append('search', searchTerm.trim());
      }
      if (statusFilter && statusFilter !== 'all') {
        distributionParams.append('status', statusFilter);
      }
      const distributionUrl = `/api/admin/order-status-distribution?${distributionParams.toString()}`;
      const [ordersRes, distributionRes] = await Promise.all([
        fetch(ordersUrl, { headers }),
        fetch(distributionUrl, { headers })
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
          <h3>Shipped</h3>
          <p className="stat-number">{stats.shipped_orders}</p>
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
          
          {/* Status Filter - Under Search Field */}
          <div className="status-filters" style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('all')}
              style={{
                padding: '8px 16px',
                border: `2px solid ${statusFilter === 'all' ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '6px',
                backgroundColor: statusFilter === 'all' ? '#3b82f6' : 'white',
                color: statusFilter === 'all' ? 'white' : '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              All ({pagination.totalItems})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('pending')}
              style={{
                padding: '8px 16px',
                border: `2px solid ${statusFilter === 'pending' ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '6px',
                backgroundColor: statusFilter === 'pending' ? '#3b82f6' : 'white',
                color: statusFilter === 'pending' ? 'white' : '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Pending
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('processing')}
              style={{
                padding: '8px 16px',
                border: `2px solid ${statusFilter === 'processing' ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '6px',
                backgroundColor: statusFilter === 'processing' ? '#3b82f6' : 'white',
                color: statusFilter === 'processing' ? 'white' : '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Processing
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('shipped')}
              style={{
                padding: '8px 16px',
                border: `2px solid ${statusFilter === 'shipped' ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '6px',
                backgroundColor: statusFilter === 'shipped' ? '#3b82f6' : 'white',
                color: statusFilter === 'shipped' ? 'white' : '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Shipped
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('delivered')}
              style={{
                padding: '8px 16px',
                border: `2px solid ${statusFilter === 'delivered' ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '6px',
                backgroundColor: statusFilter === 'delivered' ? '#3b82f6' : 'white',
                color: statusFilter === 'delivered' ? 'white' : '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Delivered
            </button>
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
