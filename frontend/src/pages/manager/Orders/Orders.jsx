import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatPriceConverted } from '../../../utils/currency';
import { formatDate, formatDateTime } from '../../../utils/dateFormat';
import Pagination from '../../../components/Pagination/Pagination';
import './Orders.css';

const Orders = () => {
  const { isUserAdmin, loadingSettings, currency } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total_orders: 0, pending_orders: 0, processing_orders: 0, shipped_orders: 0, delivered_orders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const searchInputRef = useRef(null);
  const isTypingRef = useRef(false);
  const [sortField, setSortField] = useState('order_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all'); // 'all', 'pending', 'processing', 'shipped', 'delivered'
  const [userFilter, setUserFilter] = useState(searchParams.get('userId') || 'all'); // 'all' or user_id
  const [users, setUsers] = useState([]); // List of users for dropdown
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  
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


  // Sync sort and filter state from URL for UI display (but not searchTerm if user is typing)
  useEffect(() => {
    const urlSortField = searchParams.get('sortField');
    const urlSortDirection = searchParams.get('sortDirection');
    const urlStatus = searchParams.get('status') || 'all';
    const urlSearch = searchParams.get('search') || '';
    const urlUserId = searchParams.get('userId') || 'all';
    
    if (urlSortField) {
      setSortField(urlSortField);
      setSortDirection(urlSortDirection === 'desc' ? 'desc' : 'asc');
    }
    setStatusFilter(urlStatus);
    // Only sync searchTerm from URL if user is not actively typing
    if (!isTypingRef.current) {
      setSearchTerm(urlSearch);
    }
    setUserFilter(urlUserId);
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
    if (userFilter && userFilter !== 'all') params.set('userId', userFilter); else params.delete('userId');
    params.set('sortField', field);
    params.set('sortDirection', nextDirection);
    setSearchParams(params);
    // Rely on URL sync effect to trigger refetch
  };

  // Render server-sorted orders directly



  // Auto-refocus search input after re-renders to maintain typing experience
  useEffect(() => {
    if (searchInputRef.current && isTypingRef.current) {
      requestAnimationFrame(() => {
        if (searchInputRef.current) {
          const cursorPosition = searchInputRef.current.selectionStart || searchTerm.length;
          searchInputRef.current.focus();
          searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    }
  });

  // Fetch statistics separately - always global (no filters)
  const fetchStatistics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch statistics WITHOUT any filters (always global)
      const distributionUrl = `/api/admin/order-status-distribution`;
      const distributionRes = await fetch(distributionUrl, { headers });

      if (!distributionRes.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const distributionData = await distributionRes.json();
      const processedStats = processStats(distributionData);
      setStats(processedStats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  // Fetch statistics on initial load only
  useEffect(() => {
    if (!isUserAdmin || loadingSettings) {
      if (!loadingSettings && !isUserAdmin) {
        navigate('/');
      }
      return;
    }
    fetchStatistics();
  }, [isUserAdmin, loadingSettings, navigate, fetchStatistics]);

  // Main fetch effect - only triggers on URL changes (not searchTerm changes)
  useEffect(() => {
    if (!isUserAdmin || loadingSettings) {
      if (!loadingSettings && !isUserAdmin) {
        navigate('/');
      }
      return;
    }

    // Skip if user is actively typing (let debounced search handle it)
    if (isTypingRef.current) {
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

        // Read page, status, search, and userId from URL (single source of truth)
        const urlPage = parseInt(searchParams.get('page')) || 1;
        const urlStatus = searchParams.get('status') || 'all';
        const urlUserId = searchParams.get('userId') || 'all';
        const urlSearch = searchParams.get('search') || '';

        const params = new URLSearchParams({
          page: urlPage.toString(),
          limit: '10'
        });
        if (urlSearch.trim()) {
          params.append('search', urlSearch.trim());
        }
        if (urlStatus && urlStatus !== 'all') {
          params.append('status', urlStatus);
        }
        if (urlUserId && urlUserId !== 'all') {
          params.append('userId', urlUserId);
        }
        // Sorting from URL only (single source of truth)
        const urlSortField = searchParams.get('sortField');
        const urlSortDirection = searchParams.get('sortDirection');
        if (urlSortField && urlSortDirection) {
          params.append('sortField', urlSortField);
          params.append('sortDirection', urlSortDirection);
        }
        const ordersUrl = `/api/admin/orders?${params.toString()}`;
        const ordersRes = await fetch(ordersUrl, { headers });

        if (!ordersRes.ok) {
          throw new Error('Failed to fetch orders data');
        }

        const ordersData = await ordersRes.json();

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
        // Don't update stats here - they are fetched separately and always global

      } catch (err) {
        setError(err.message || 'Failed to fetch orders data.');
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isUserAdmin, loadingSettings, navigate, searchParams]); // URL is single source of truth, no need for searchTerm/statusFilter in deps

  // Handle page changes - inline fetch to avoid dependency issues
  const handlePageChange = useCallback(async (newPage) => {
    // Update URL parameters for pagination
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    // Keep existing search, status, and sort from URL
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

      // Read all params from URL (single source of truth)
      const urlSearch = searchParams.get('search') || '';
      const urlStatus = searchParams.get('status') || 'all';
      const urlUserId = searchParams.get('userId') || 'all';
      const existingUrlSortField = searchParams.get('sortField');
      const existingUrlSortDirection = searchParams.get('sortDirection');

      const fetchParams = new URLSearchParams({
        page: newPage.toString(),
        limit: '10'
      });
      if (urlSearch.trim()) {
        fetchParams.append('search', urlSearch.trim());
      }
      if (urlStatus && urlStatus !== 'all') {
        fetchParams.append('status', urlStatus);
      }
      if (urlUserId && urlUserId !== 'all') {
        fetchParams.append('userId', urlUserId);
      }
      // Sorting from URL only (single source of truth)
      if (existingUrlSortField && existingUrlSortDirection) {
        fetchParams.append('sortField', existingUrlSortField);
        fetchParams.append('sortDirection', existingUrlSortDirection);
      }
      const ordersUrl = `/api/admin/orders?${fetchParams.toString()}`;
      const ordersRes = await fetch(ordersUrl, { headers });

      if (!ordersRes.ok) {
        throw new Error(`HTTP error! status: ${ordersRes.status}`);
      }

      const ordersData = await ordersRes.json();

      const ordersArray = ordersData.orders || ordersData;
      setOrders(ordersArray);
      
      // Don't update stats here - they are fetched separately and always global
      
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
    isTypingRef.current = true;
  }, []);

  // Debounced search effect - directly fetches data without URL updates (like Customers)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isUserAdmin && !loadingSettings && searchTerm.trim()) {
        // Only perform search if there's actually a search term
        const performSearch = async () => {
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
              page: '1',
              limit: '10'
            });

            if (searchTerm.trim()) {
              fetchParams.append('search', searchTerm.trim());
            }

            // Get filters from URL
            const urlStatus = searchParams.get('status') || 'all';
            const urlUserId = searchParams.get('userId') || 'all';
            if (urlStatus && urlStatus !== 'all') {
              fetchParams.append('status', urlStatus);
            }
            if (urlUserId && urlUserId !== 'all') {
              fetchParams.append('userId', urlUserId);
            }

            // Sorting from URL only
            const urlSortField = searchParams.get('sortField');
            const urlSortDirection = searchParams.get('sortDirection');
            if (urlSortField && urlSortDirection) {
              fetchParams.append('sortField', urlSortField);
              fetchParams.append('sortDirection', urlSortDirection);
            }

            const response = await fetch(`/api/admin/orders?${fetchParams}`, {
              headers
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const orders = data.orders || data;
            setOrders(orders);

            if (data.pagination) {
              setPagination(data.pagination);
            } else {
              setPagination(prev => ({
                ...prev,
                currentPage: 1 // Reset to page 1 when searching
              }));
            }

            isTypingRef.current = false;
          } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to fetch orders');
            isTypingRef.current = false;
          } finally {
            setLoading(false);
          }
        };
        
        performSearch();
      } else if (isUserAdmin && !loadingSettings && !searchTerm.trim()) {
        // If search term is cleared, reload the current page without search
        const loadCurrentPage = async () => {
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

            const page = parseInt(searchParams.get('page')) || 1;
            const currentStatus = searchParams.get('status') || 'all';
            const currentUserId = searchParams.get('userId') || 'all';
            const params = new URLSearchParams({
              page: page.toString(),
              limit: '10'
            });
            
            if (currentStatus && currentStatus !== 'all') {
              params.append('status', currentStatus);
            }
            if (currentUserId && currentUserId !== 'all') {
              params.append('userId', currentUserId);
            }

            // Sorting from URL only
            const urlSortField = searchParams.get('sortField');
            const urlSortDirection = searchParams.get('sortDirection');
            if (urlSortField && urlSortDirection) {
              params.append('sortField', urlSortField);
              params.append('sortDirection', urlSortDirection);
            }

            const response = await fetch(`/api/admin/orders?${params}`, {
              headers
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const orders = data.orders || data;
            setOrders(orders);

            if (data.pagination) {
              setPagination(data.pagination);
            } else {
              setPagination(prev => ({
                ...prev,
                currentPage: page
              }));
            }

            isTypingRef.current = false;
          } catch (error) {
            console.error('Error clearing search:', error);
            setError('Failed to clear search');
            isTypingRef.current = false;
          } finally {
            setLoading(false);
          }
        };
        
        loadCurrentPage();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isUserAdmin, loadingSettings, searchParams]);
  
  // Handle status filter changes
  const handleStatusFilterChange = useCallback((newStatus) => {
    // Update URL to persist filter and preserve sort/search/userId
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (newStatus && newStatus !== 'all') {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    // Keep existing search, userId, and sort from URL
    setSearchParams(params);
    // State will be synced from URL via useEffect
  }, [searchParams, setSearchParams]);

  // Handle user filter changes
  const handleUserFilterChange = useCallback((newUserId) => {
    // Update URL to persist filter and preserve sort/search/status
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (newUserId && newUserId !== 'all') {
      params.set('userId', newUserId);
    } else {
      params.delete('userId');
    }
    // Keep existing search, status, and sort from URL
    setSearchParams(params);
    // State will be synced from URL via useEffect
  }, [searchParams, setSearchParams]);

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch all users (customers) for the dropdown
        const response = await fetch('/api/admin/customers?limit=1000&page=1', { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        const usersList = data.customers || data;
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (isUserAdmin && !loadingSettings) {
      fetchUsers();
    }
  }, [isUserAdmin, loadingSettings]);


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
      
      // Read page, status, search, userId, and sort from URL (single source of truth)
      const urlPage = parseInt(searchParams.get('page')) || pagination.currentPage;
      const urlSearch = searchParams.get('search') || '';
      const urlStatus = searchParams.get('status') || 'all';
      const urlUserId = searchParams.get('userId') || 'all';
      const urlSortField = searchParams.get('sortField');
      const urlSortDirection = searchParams.get('sortDirection');
      
      const ordersParams = new URLSearchParams({
        page: urlPage.toString(),
        limit: '10'
      });
      if (urlSearch.trim()) {
        ordersParams.append('search', urlSearch.trim());
      }
      if (urlStatus && urlStatus !== 'all') {
        ordersParams.append('status', urlStatus);
      }
      if (urlUserId && urlUserId !== 'all') {
        ordersParams.append('userId', urlUserId);
      }
      if (urlSortField && urlSortDirection) {
        ordersParams.append('sortField', urlSortField);
        ordersParams.append('sortDirection', urlSortDirection);
      }
      const ordersUrl = `/api/admin/orders?${ordersParams.toString()}`;
      const ordersRes = await fetch(ordersUrl, { headers });

      if (!ordersRes.ok) {
        throw new Error('Failed to refresh orders data');
      }

      const ordersData = await ordersRes.json();

      setOrders(ordersData.orders || ordersData);
      // Don't update stats here - they are fetched separately and always global
      
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
        {/* Search and Filter Header */}
        <div className="orders-header-filters">
          <div className="search-input-wrapper">
            <input
              id="search-term"
              type="text"
              placeholder="Search by name, email, or order ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              ref={searchInputRef}
              className="orders-search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          {/* User Filter Dropdown */}
          <div className="user-filter-wrapper" style={{ marginLeft: '12px' }}>
            <select
              value={userFilter}
              onChange={(e) => handleUserFilterChange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: '#ffffff',
                minWidth: '200px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.user_id} value={user.user_id}>
                  {user.email} {user.name ? `(${user.name})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('processing')}
            >
              Processing
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('shipped')}
            >
              Shipped
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('delivered')}
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
                <td>{formatPriceConverted(order.total_amount, currency)}</td>
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
            <p><strong>Total:</strong> {formatPriceConverted(selectedOrder.total_price, currency)}</p>
            {selectedOrder.promotion_code && (
              <p><strong>Promotion:</strong> <span className="promotion-badge">{selectedOrder.promotion_code}</span></p>
            )}
            <h3>Products</h3>
            <ul className="order-products-list">
              {(selectedOrder.products || []).map((item, idx) => (
                <li key={idx}>
                  <span>{item.product_name || item.name} (x{item.quantity})</span>
                  <span>{formatPriceConverted(item.price_at_order * item.quantity, currency)}</span>
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
