import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { formatPrice } from '../../utils/currency';
import { formatDate } from '../../utils/dateFormat';
import './Customers.css';

const Customers = () => {
    const { isUserAdmin, loadingSettings, currency } = useSettings();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [showOrdersModal, setShowOrdersModal] = useState(false);

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

    const handleViewOrders = async (customer) => {
        setSelectedCustomer(customer);
        await fetchCustomerOrders(customer.user_id);
        setShowOrdersModal(true);
    };

    const handleDeleteCustomer = async (customer) => {
        if (!window.confirm(`Are you sure you want to delete customer "${customer.username}"? This action cannot be undone.`)) {
            return;
        }

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
                throw new Error(errorData.message || 'Failed to delete customer');
            }

            // Remove the customer from the local state
            setCustomers(prevCustomers => 
                prevCustomers.filter(c => c.user_id !== customer.user_id)
            );

            alert('Customer deleted successfully');
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert(`Error deleting customer: ${error.message}`);
        }
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
                <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <span className="search-icon">
                    🔍
                </span>
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
                            <th className="table-header-cell center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.user_id} className="table-body-row">
                                <td className="table-body-cell">{customer.username || 'N/A'}</td>
                                <td className="table-body-cell">{customer.email || 'N/A'}</td>
                                <td className="table-body-cell">{customer.phone || 'N/A'}</td>
                                <td className="table-body-cell">{customer.order_count || 0}</td>
                                <td className="table-body-cell">{formatPrice(customer.total_spent || 0, currency)}</td>
                                <td className="table-body-cell center">
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => handleViewOrders(customer)}
                                            className="action-btn view-orders-btn"
                                        >
                                            View Orders
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCustomer(customer)}
                                            className="action-btn delete-btn"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan="6" className="no-customers">No customers found.</td>
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
                                        <div className="order-info">
                                            <span className="order-id">Order #{order.order_id}</span>
                                            <span className="order-date">{formatDate(order.order_date)}</span>
                                        </div>
                                        <span className="order-total">{formatPrice(order.total_price, currency)}</span>
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