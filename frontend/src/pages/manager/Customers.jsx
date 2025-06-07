import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const Customers = () => {
    const { isUserAdmin, loadingSettings } = useSettings();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

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
                // For now, assume data has username and email
                // Future: add phone, orders, total spent
                setCustomers(data);
            } catch (error) {
                console.error('Error fetching customers:', error);
                // Optionally, show an error message to the user
            }
        };

        fetchCustomers();
    }, [isUserAdmin, loadingSettings, navigate]);

    if (loadingSettings) {
        return <div>Loading Admin Panel...</div>; // Show loading state
    }

    if (!isUserAdmin) {
        return null; // Should redirect, but return null just in case
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
                        padding: '10px 15px 10px 40px', // Adjust padding for icon
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '1em',
                    }}
                />
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>
                    {/* Search icon - using a simple text icon for now */}
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
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px' }}>{customer.username}</td>
                                <td style={{ padding: '15px' }}>{customer.email}</td>
                                <td style={{ padding: '15px' }}>{customer.phone || 'N/A'}</td> {/* Placeholder for phone */}
                                <td style={{ padding: '15px' }}>{customer.orders || 0}</td> {/* Placeholder for orders */}
                                <td style={{ padding: '15px' }}>{customer.totalSpent ? `$${customer.totalSpent.toFixed(2)}` : '$0.00'}</td> {/* Placeholder for totalSpent */}
                            </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Customers;