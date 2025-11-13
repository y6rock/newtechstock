import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { formatPriceConverted } from '../../utils/currency';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const { currency } = useSettings();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/api/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setOrderDetails(response.data);
            } catch (err) {
                console.error('Error fetching order details:', err);
                setError('Unable to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="order-confirmation-container">
                <div className="order-confirmation-loading">Loading order details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="order-confirmation-container">
                <h1 className="order-confirmation-title">Order Confirmation</h1>
                <p className="order-confirmation-error">{error}</p>
                <p className="order-confirmation-message">Your Order ID is: <strong className="order-confirmation-order-id">{orderId}</strong></p>
            </div>
        );
    }

    const getStatusMessage = () => {
        if (!orderDetails) return 'Order placed successfully!';
        
        switch (orderDetails.status) {
            case 'confirmed':
                return 'Order confirmed and payment successful!';
            case 'pending':
                return 'Order placed successfully! Payment is being processed.';
            case 'cancelled':
                return 'Order was cancelled.';
            default:
                return 'Order placed successfully!';
        }
    };

    const getPaymentMethodText = () => {
        if (!orderDetails) return '';
        
        switch (orderDetails.payment_method) {
            case 'paypal':
                return 'PayPal';
            case 'credit_card':
                return 'Credit Card';
            default:
                return orderDetails.payment_method || 'Unknown';
        }
    };

    return (
        <div className="order-confirmation-container">
            <h1 className="order-confirmation-title">Order Placed Successfully!</h1>
            <p className="order-confirmation-message">{getStatusMessage()}</p>
            <p className="order-confirmation-message">Your Order ID is: <strong className="order-confirmation-order-id">{orderId}</strong></p>
            
            {orderDetails && (
                <div className="order-confirmation-details">
                    <p className="order-confirmation-message">Payment Method: <strong>{getPaymentMethodText()}</strong></p>
                    <p className="order-confirmation-message">Total Amount: <strong>{formatPriceConverted(orderDetails.total_price, currency)}</strong></p>
                    <p className="order-confirmation-message">Status: <strong>{orderDetails.status}</strong></p>
                </div>
            )}
            
            <p className="order-confirmation-message">Thank you for your purchase.</p>
            <p className="order-confirmation-message">You can view your order details in your <Link to="/order-history" className="order-confirmation-link">Order History</Link>.</p>
        </div>
    );
};

export default OrderConfirmation; 