import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/currency';
import { formatDate } from '../../utils/dateFormat';
import Pagination from '../../components/Pagination';
import './Customers.css';

const Customers = () => {
    const { isUserAdmin, loadingSettings, currency } = useSettings();
    const { showSuccess, showError, showConfirm } = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orderItems, setOrderItems] = useState({});
    const [sortField, setSortField] = useState('username');
    const [sortDirection, setSortDirection] = useState('asc');

    // Fetch customers with optional search query and pagination
    const fetchCustomers = useCallback(async (searchQuery = '', page = 1) => {
        try {
            setIsSearching(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }
            
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });
            
            if (searchQuery.trim()) {
                params.append('q', searchQuery.trim());
            }
                
            const response = await fetch(`/api/admin/customers?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setCustomers(data.customers || data); // Handle both old and new response format
            
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            showError('Failed to fetch customers');
        } finally {
            setIsSearching(false);
        }
    }, [showError]);

    // Handle page changes
    const handlePageChange = useCallback((newPage) => {
        // Update URL parameters for pagination
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        if (searchTerm) {
            params.set('search', searchTerm);
        } else {
            params.delete('search');
        }
        setSearchParams(params);

        // Inline fetch to avoid dependency issues
        const loadPage = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                const pageParams = new URLSearchParams({
                    page: newPage.toString(),
                    limit: '10'
                });

                if (searchTerm.trim()) {
                    pageParams.append('q', searchTerm.trim());
                }

                const response = await fetch(`/api/admin/customers?${pageParams}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setCustomers(data.customers || data);

                if (data.pagination) {
                    setPagination(data.pagination);
                }
            } catch (error) {
                console.error('Error loading page:', error);
                showError('Failed to load customers');
            }
        };

        loadPage();
    }, [searchParams, setSearchParams, searchTerm, showError]);

    // Handle search term changes - optimized to prevent input focus loss
    const handleSearchChange = useCallback((newSearchTerm) => {
        setSearchTerm(newSearchTerm);
        // Don't update URL params here - let the debounced effect handle it
        // This prevents the input from losing focus on every keystroke
    }, []);

    // Debounced search effect - optimized to prevent input focus loss and infinite loops
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (isUserAdmin && !loadingSettings) {
                // Fetch customers with current search term - inline the fetch logic to avoid dependency issues
                const performSearch = async () => {
                    try {
                        setIsSearching(true);
                        const token = localStorage.getItem('token');
                        if (!token) {
                            throw new Error('No token found');
                        }

                        const searchParams = new URLSearchParams({
                            page: '1',
                            limit: '10'
                        });

                        if (searchTerm.trim()) {
                            searchParams.append('q', searchTerm.trim());
                        }

                        const response = await fetch(`/api/admin/customers?${searchParams}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const data = await response.json();
                        setCustomers(data.customers || data);

                        if (data.pagination) {
                            setPagination(data.pagination);
                        }

                        // Only update URL if search term is not empty (optional - for bookmarking)
                        // Commenting out to prevent re-renders that cause input focus loss
                        /*
                        const urlParams = new URLSearchParams();
                        urlParams.set('page', '1');
                        if (searchTerm.trim()) {
                            urlParams.set('search', searchTerm);
                        }
                        setSearchParams(urlParams);
                        */

                    } catch (error) {
                        console.error('Error fetching customers:', error);
                        showError('Failed to fetch customers');
                    } finally {
                        setIsSearching(false);
                    }
                };

                performSearch();
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isUserAdmin, loadingSettings, showError]);

    useEffect(() => {
        if (loadingSettings) {
            return; // Wait for settings to load
        }
        if (!isUserAdmin) {
            navigate('/'); // Redirect if not admin
            return;
        }

        // Load customers with current URL parameters - inline fetch to avoid dependency issues
        const loadCustomers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                const page = parseInt(searchParams.get('page')) || 1;
                const search = searchParams.get('search') || '';
                setSearchTerm(search);

                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '10'
                });

                if (search.trim()) {
                    params.append('q', search.trim());
                }

                const response = await fetch(`/api/admin/customers?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setCustomers(data.customers || data);

                if (data.pagination) {
                    setPagination(data.pagination);
                }
            } catch (error) {
                console.error('Error loading customers:', error);
                showError('Failed to load customers');
            }
        };

        loadCustomers();
    }, [isUserAdmin, loadingSettings, navigate, searchParams, showError]);

    // Sorting function
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const fetchCustomerOrders = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/orders?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setCustomerOrders(data);
        } catch (error) {
            console.error('Error fetching customer orders:', error);
        }
    };

    const fetchOrderItems = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setOrderItems(prev => ({
                ...prev,
                [orderId]: data.products || []
            }));
        } catch (error) {
            console.error('Error fetching order items:', error);
        }
    };

    const toggleOrderItems = async (orderId) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
        } else {
            setExpandedOrderId(orderId);
            if (!orderItems[orderId]) {
                await fetchOrderItems(orderId);
            }
        }
    };

    const handleViewOrders = async (customer) => {
        setSelectedCustomer(customer);
        await fetchCustomerOrders(customer.user_id);
        setShowOrdersModal(true);
    };

    const handleDeleteCustomer = async (customer) => {
        showConfirm(
            `Are you sure you want to deactivate customer "${customer.username}"? They will be marked as inactive but can be restored later.`,
            async () => {

                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/admin/customers/${customer.user_id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to deactivate customer');
                    }

                    showSuccess('Customer deactivated successfully!');
                    // Refresh the customers list to show updated status
                    const updatedCustomers = customers.map(c => 
                        c.user_id === customer.user_id ? { ...c, isActive: false } : c
                    );
                    setCustomers(updatedCustomers);
                } catch (error) {
                    console.error('Error deactivating customer:', error);
                    showError(`Error deactivating customer: ${error.message}`);
                }
            },
            () => {
                // Cancel callback - do nothing
            }
        );
    };

    const handleRestoreCustomer = async (customer) => {
        showConfirm(
            `Are you sure you want to restore customer "${customer.username}"? They will be reactivated and able to use the system again.`,
            async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/admin/customers/${customer.user_id}/restore`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to restore customer');
                    }

                    showSuccess('Customer restored successfully!');
                    // Refresh the customers list to show updated status
                    const updatedCustomers = customers.map(c => 
                        c.user_id === customer.user_id ? { ...c, isActive: true } : c
                    );
                    setCustomers(updatedCustomers);
                } catch (error) {
                    console.error('Error restoring customer:', error);
                    showError(`Error restoring customer: ${error.message}`);
                }
            },
            () => {
                // Cancel callback - do nothing
            }
        );
    };

    if (loadingSettings) {
        return <div className="customers-loading">Loading Admin Panel...</div>;
    }

    if (!isUserAdmin) {
        return null;
    }

    // Client-side sorting (since backend search is already applied)
    const sortedCustomers = [...customers].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle different data types
        if (sortField === 'total_spent') {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
        } else if (sortField === 'order_count') {
            aValue = parseInt(aValue) || 0;
            bValue = parseInt(bValue) || 0;
        } else if (sortField === 'isActive') {
            aValue = a.isActive ? 1 : 0;
            bValue = b.isActive ? 1 : 0;
        } else if (typeof aValue === 'string') {
            aValue = (aValue || '').toLowerCase();
            bValue = (bValue || '').toLowerCase();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Show loading state while settings are loading or if not admin
    if (loadingSettings || !isUserAdmin) {
        return (
            <div className="customers-loading">
                <p>{loadingSettings ? 'Loading admin panel...' : 'Access denied. Admin privileges required.'}</p>
            </div>
        );
    }


    return (
        <div className="customers-container">
            <h1 className="customers-title">Customers</h1>
            <p className="customers-subtitle">Manage your customer database</p>

            {/* Search Section */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                marginBottom: '30px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
            }}>
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                }}>
                    🔍 Search Customers
                </label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search customers by name or email..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '14px 20px 14px 45px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '12px',
                            fontSize: '16px',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                    />
                    <span style={{
                        position: 'absolute',
                        left: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        fontSize: '16px',
                        pointerEvents: 'none'
                    }}>
                        🔍
                    </span>
                </div>
                {isSearching && (
                    <div style={{ marginTop: '10px', color: '#007bff', fontSize: '14px' }}>
                        Searching...
                    </div>
                )}
                {!isSearching && searchTerm && (
                    <div style={{ marginTop: '10px', color: '#28a745', fontSize: '14px' }}>
                        {pagination.totalItems} customer{pagination.totalItems !== 1 ? 's' : ''} found
                    </div>
                )}
            </div>

            <div className="table-container">
                <table className="customers-table">
                    <thead>
                        <tr className="table-header-row">
                            <th 
                                className={`table-header-cell sortable ${sortField === 'username' ? 'active' : ''}`}
                                onClick={() => handleSort('username')}
                            >
                                Name
                                <span className="sort-arrow">
                                    {sortField === 'username' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                                </span>
                            </th>
                            <th 
                                className={`table-header-cell sortable ${sortField === 'email' ? 'active' : ''}`}
                                onClick={() => handleSort('email')}
                            >
                                Email
                                <span className="sort-arrow">
                                    {sortField === 'email' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                                </span>
                            </th>
                            <th 
                                className={`table-header-cell sortable ${sortField === 'phone' ? 'active' : ''}`}
                                onClick={() => handleSort('phone')}
                            >
                                Phone
                                <span className="sort-arrow">
                                    {sortField === 'phone' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                                </span>
                            </th>
                            <th 
                                className={`table-header-cell sortable ${sortField === 'order_count' ? 'active' : ''}`}
                                onClick={() => handleSort('order_count')}
                            >
                                Orders
                                <span className="sort-arrow">
                                    {sortField === 'order_count' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                                </span>
                            </th>
                            <th 
                                className={`table-header-cell sortable ${sortField === 'total_spent' ? 'active' : ''}`}
                                onClick={() => handleSort('total_spent')}
                            >
                                Total Spent
                                <span className="sort-arrow">
                                    {sortField === 'total_spent' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                                </span>
                            </th>
                            <th 
                                className={`table-header-cell sortable ${sortField === 'isActive' ? 'active' : ''}`}
                                onClick={() => handleSort('isActive')}
                            >
                                Status
                                <span className="sort-arrow">
                                    {sortField === 'isActive' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                                </span>
                            </th>
                            <th className="table-header-cell center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCustomers.map((customer) => (
                            <tr key={customer.user_id} className={`table-body-row ${customer.isActive === false ? 'inactive-row' : ''}`}>
                                <td className="table-body-cell">{customer.username || 'N/A'}</td>
                                <td className="table-body-cell">{customer.email || 'N/A'}</td>
                                <td className="table-body-cell">{customer.phone || 'N/A'}</td>
                                <td className="table-body-cell">{customer.order_count || 0}</td>
                                <td className="table-body-cell">{formatPrice(customer.total_spent || 0, currency)}</td>
                                <td className="table-body-cell">
                                    <span className={`status-badge ${customer.isActive === false ? 'inactive' : 'active'}`}>
                                        {customer.isActive === false ? 'Inactive' : 'Active'}
                                    </span>
                                </td>
                                <td className="table-body-cell center">
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => handleViewOrders(customer)}
                                            className="action-btn view-orders-btn"
                                        >
                                            View Orders
                                        </button>
                                        {customer.isActive === false ? (
                                            <button
                                                onClick={() => handleRestoreCustomer(customer)}
                                                className="action-btn restore-btn"
                                            >
                                                Restore
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleDeleteCustomer(customer)}
                                                className="action-btn delete-btn"
                                            >
                                                Deactivate
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedCustomers.length === 0 && (
                            <tr>
                                <td colSpan="7" className="no-customers">No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={handlePageChange}
            />

            {/* Orders Modal */}
            {showOrdersModal && selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Orders for {selectedCustomer.username}</h2>
                            <button
                                onClick={() => setShowOrdersModal(false)}
                                className="close-btn"
                            >
                                Close
                            </button>
                        </div>
                        
                        {customerOrders.length === 0 ? (
                            <p className="no-orders">No orders found for this customer.</p>
                        ) : (
                            <div className="orders-list">
                                {customerOrders.map(order => (
                                    <div key={order.order_id} className="order-item">
                                        <div 
                                            className="order-header" 
                                            onClick={() => toggleOrderItems(order.order_id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="order-info">
                                                <span className="order-id">Order #{order.order_id}</span>
                                                <span className="order-date">{formatDate(order.order_date)}</span>
                                                <span className="order-status">{order.status}</span>
                                            </div>
                                            <div className="order-amount-toggle">
                                                <span className="order-total">{formatPrice(order.total_amount, currency)}</span>
                                                <span className="toggle-icon">
                                                    {expandedOrderId === order.order_id ? '▼' : '▶'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {expandedOrderId === order.order_id && (
                                            <div className="order-items-dropdown">
                                                {orderItems[order.order_id] ? (
                                                    orderItems[order.order_id].length > 0 ? (
                                                        <div className="items-list">
                                                            {orderItems[order.order_id].map((item, index) => (
                                                                <div key={index} className="order-item-detail">
                                                                    <span className="item-name">{item.product_name}</span>
                                                                    <span className="item-quantity">Qty: {item.quantity}</span>
                                                                    <span className="item-price">{formatPrice(item.price_at_order, currency)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="no-items">No items found for this order.</p>
                                                    )
                                                ) : (
                                                    <p className="loading-items">Loading items...</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;