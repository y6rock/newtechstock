import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/currency';
import { formatDate } from '../../utils/dateFormat';
import './Customers.css';

const Customers = () => {
    const { isUserAdmin, loadingSettings, currency } = useSettings();
    const { showSuccess, showError, showConfirm } = useToast();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orderItems, setOrderItems] = useState({});

    useEffect(() => {
        if (loadingSettings) {
            return; // Wait for settings to load
        }
        if (!isUserAdmin) {
            navigate('/'); // Redirect if not admin
            return;
        }

        const fetchCustomers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }
                const response = await fetch('/api/admin/customers', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCustomers(data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };

        fetchCustomers();
    }, [isUserAdmin, loadingSettings, navigate]);

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

    const filteredCustomers = customers.filter(customer =>
        customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="customers-container">
            <h1 className="customers-title">Customers</h1>
            <p className="customers-subtitle">Manage your customer database</p>

            <div className="search-section">
                <label className="search-label">Search Customers</label>
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        placeholder="Search customers by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <span className="search-icon">
                        🔍
                    </span>
                </div>
                {searchTerm && (
                    <div className="search-results-count">
                        {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                    </div>
                )}
            </div>

            <div className="table-container">
                <table className="customers-table">
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header-cell">Name</th>
                            <th className="table-header-cell">Email</th>
                            <th className="table-header-cell">Phone</th>
                            <th className="table-header-cell">Orders</th>
                            <th className="table-header-cell">Total Spent</th>
                            <th className="table-header-cell">Status</th>
                            <th className="table-header-cell center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
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
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan="7" className="no-customers">No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

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