import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
    const { orderId } = useParams();

    return (
        <div className="order-confirmation-container">
            <h1 className="order-confirmation-title">Order Placed Successfully!</h1>
            <p className="order-confirmation-message">Your Order ID is: <strong className="order-confirmation-order-id">{orderId}</strong></p>
            <p className="order-confirmation-message">Thank you for your purchase.</p>
            <p className="order-confirmation-message">You can view your order details in your <Link to="/order-history" className="order-confirmation-link">Order History</Link>.</p>
        </div>
    );
};

export default OrderConfirmation; 