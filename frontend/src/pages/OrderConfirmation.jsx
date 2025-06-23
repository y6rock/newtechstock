import React from 'react';
import { useParams, Link } from 'react-router-dom';

const OrderConfirmation = () => {
    const { orderId } = useParams();

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>Order Placed Successfully!</h1>
            <p>Your Order ID is: <strong>{orderId}</strong></p>
            <p>Thank you for your purchase.</p>
            <p>You can view your order details in your <Link to="/order-history">Order History</Link>.</p>
        </div>
    );
};

export default OrderConfirmation; 