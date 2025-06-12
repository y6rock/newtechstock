import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const Customers = () => {
    const { isUserAdmin, loadingSettings } = useSettings();
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
                const response = await fetch('/api/customers', {
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

    if (loadingSettings) {
        return <div>Loading Admin Panel...</div>;
    }

    if (!isUserAdmin) {
        return null;
    }

    const filteredCustomers = customers.filter(customer =>
        customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ flex: 1, padding: '20px' }}>
            <h1 style={{ fontSize: '2em', marginBottom: '10px' }}>Customers</h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>Manage your customer database</p>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 15px 10px 40px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '1em',
                    }}
                />
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>
                    🔍
                </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Name</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Email</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Phone</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Orders</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Total Spent</th>
                            <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.user_id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px' }}>{customer.username}</td>
                                <td style={{ padding: '15px' }}>{customer.email}</td>
                                <td style={{ padding: '15px' }}>{customer.phone || 'N/A'}</td>
                                <td style={{ padding: '15px' }}>{customer.order_count}</td>
                                <td style={{ padding: '15px' }}>${parseFloat(customer.total_spent).toFixed(2)}</td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleViewOrders(customer)}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: '#007bff',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        View Orders
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Orders Modal */}
            {showOrdersModal && selectedCustomer && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '80%',
                        maxWidth: '800px',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>Orders for {selectedCustomer.username}</h2>
                            <button
                                onClick={() => setShowOrdersModal(false)}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#dc3545',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                        
                        {customerOrders.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666' }}>No orders found for this customer.</p>
                        ) : (
                            <div>
                                {customerOrders.map(order => (
                                    <div key={order.order_id} style={{
                                        border: '1px solid #eee',
                                        borderRadius: '8px',
                                        padding: '15px',
                                        marginBottom: '15px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <h3 style={{ margin: 0 }}>Order #{order.order_id}</h3>
                                            <span style={{ fontWeight: 'bold' }}>${parseFloat(order.total_price).toFixed(2)}</span>
                                        </div>
                                        <p style={{ margin: '5px 0', color: '#666' }}>
                                            Date: {new Date(order.order_date).toLocaleDateString()}
                                        </p>
                                        <p style={{ margin: '5px 0', color: '#666' }}>
                                            Status: <span style={{
                                                color: order.status === 'pending' ? '#ffc107' : '#28a745',
                                                fontWeight: 'bold',
                                                textTransform: 'capitalize'
                                            }}>{order.status}</span>
                                        </p>
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