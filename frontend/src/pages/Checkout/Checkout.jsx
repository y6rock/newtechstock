import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatPrice } from '../../utils/currency';
import { PayPalButtons } from '@paypal/react-paypal-js';
import './Checkout.css';

const Checkout = () => {
    const { cartItems, clearCart, appliedPromotion, total, subtotal, subtotalAfterDiscount, vatAmount, netAmount, vat_rate, discountAmount } = useCart();
    const { user_id, currency } = useSettings();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [orderError, setOrderError] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [showPayPal, setShowPayPal] = useState(false);
    const [paypalLoading, setPaypalLoading] = useState(false);
    const [paypalOrderId, setPaypalOrderId] = useState(null);

    // Function to handle order cancellation when PayPal payment fails
    const handleOrderCancellation = async (orderId) => {
        if (!orderId) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/orders/${orderId}/payment-status`, {
                status: 'cancelled'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Order cancelled due to payment failure');
        } catch (error) {
            console.error('Error cancelling order:', error);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!shippingAddress.trim()) {
            setOrderError('Shipping address is required.');
            return;
        }
        if (!user_id) {
            setOrderError('You must be logged in to place an order.');
            return;
        }
        if (cartItems.length === 0) {
            setOrderError('Your cart is empty.');
            return;
        }

        setIsPlacingOrder(true);
        setOrderError(null);

        const orderData = {
            user_id,
            items: cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })),
            total_amount: total,
            shipping_address: shippingAddress,
            payment_method: paymentMethod,
            promotion_id: appliedPromotion ? appliedPromotion.promotion_id : null,
        };

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/orders', orderData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const orderId = response.data.orderId;
            console.log('Order created with ID:', orderId);

            showSuccess('Order placed successfully!');
            clearCart();
            console.log(`Navigating to /order-confirmation/${orderId}`);
            navigate(`/order-confirmation/${orderId}`);
        } catch (error) {
            const message = error.response?.data?.message || 'There was an issue placing your order.';
            console.error('Order placement error:', error);
            
            // Handle token expiration specifically
            if (error.response?.status === 403 && error.response?.data?.message === 'Invalid token') {
                showError('Your session has expired. Please log in again to continue.');
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            
            setOrderError(message);
            showError(`Error: ${message}`);
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handlePayPalPayment = async (details) => {
        if (!shippingAddress.trim()) {
            setOrderError('Shipping address is required.');
            return;
        }
        if (!user_id) {
            setOrderError('You must be logged in to place an order.');
            return;
        }
        if (cartItems.length === 0) {
            setOrderError('Your cart is empty.');
            return;
        }

        setIsPlacingOrder(true);
        setOrderError(null);

        // First, create the order with pending status
        const orderData = {
            user_id,
            items: cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })),
            total_amount: total,
            shipping_address: shippingAddress,
            payment_method: 'paypal',
            promotion_id: appliedPromotion ? appliedPromotion.promotion_id : null,
            paypal_payment_id: details.id,
        };

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/orders', orderData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const orderId = response.data.orderId;
            console.log('Order created with PayPal payment, ID:', orderId);
            setPaypalOrderId(orderId);

            // Update order status to confirmed after successful PayPal payment
            try {
                await axios.put(`/api/orders/${orderId}/payment-status`, {
                    status: 'confirmed',
                    paypal_payment_id: details.id
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('Order status updated to confirmed');
                
                showSuccess('Order placed successfully with PayPal!');
                clearCart();
                navigate(`/order-confirmation/${orderId}`);
            } catch (statusError) {
                console.error('Error updating order status:', statusError);
                // If status update fails, cancel the order
                await handleOrderCancellation(orderId);
                setOrderError('Payment verification failed. Please try again.');
                showError('Payment verification failed. Please try again.');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'There was an issue placing your order.';
            console.error('PayPal order placement error:', error);
            
            // Handle token expiration specifically
            if (error.response?.status === 403 && error.response?.data?.message === 'Invalid token') {
                showError('Your session has expired. Please log in again to continue.');
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            
            setOrderError(message);
            showError(`Error: ${message}`);
        } finally {
            setIsPlacingOrder(false);
            setPaypalOrderId(null);
        }
    };
    
    if (cartItems.length === 0 && !isPlacingOrder) {
        return (
            <div className="checkout-container empty-cart">
                <h1>Checkout</h1>
                <p>Your cart is empty. You cannot proceed to checkout.</p>
                <button onClick={() => navigate('/products')} className="start-shopping-button">Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <h1>Checkout</h1>
            <div className="checkout-content">
                <div className="order-summary-card">
                    <h2>Order Summary</h2>
                    {cartItems.map(item => (
                        <div key={item.product_id} className="summary-item">
                            <span>{item.name} (x{item.quantity})</span>
                            <span>{formatPrice(item.price * item.quantity, currency)}</span>
                        </div>
                    ))}
                    <div className="summary-total">
                        <strong>Subtotal:</strong>
                        <strong>{formatPrice(subtotal, currency)}</strong>
                    </div>
                    {discountAmount > 0 && (
                        <div className="summary-item discount">
                            <span>Discount ({appliedPromotion.name})</span>
                            <span>-{formatPrice(discountAmount, currency)}</span>
                        </div>
                    )}
                    {discountAmount > 0 && (
                        <div className="summary-item">
                            <span>Subtotal after discount:</span>
                            <span>{formatPrice(subtotalAfterDiscount, currency)}</span>
                        </div>
                    )}
                    <div className="summary-item">
                        <span>Net Amount (excluding VAT):</span>
                        <span>{formatPrice(netAmount, currency)}</span>
                    </div>
                    <div className="summary-item">
                        <span>VAT ({vat_rate}%):</span>
                        <span>{formatPrice(vatAmount, currency)}</span>
                    </div>
                    <div className="summary-total">
                        <strong>Total:</strong>
                        <strong>{formatPrice(total, currency)}</strong>
                    </div>
                </div>

                <form onSubmit={handlePlaceOrder} className="checkout-form-card">
                    <h2>Shipping & Payment</h2>
                    <div className="form-group">
                        <label htmlFor="shippingAddress">Shipping Address</label>
                        <input
                            id="shippingAddress"
                            type="text"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Enter your full address"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Payment Method</label>
                        <div className="payment-options">
                            <label>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="credit_card"
                                    checked={paymentMethod === 'credit_card'}
                                    onChange={(e) => {
                                        setPaymentMethod(e.target.value);
                                        setShowPayPal(false);
                                    }}
                                />
                                Credit Card
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="paypal"
                                    checked={paymentMethod === 'paypal'}
                                    onChange={(e) => {
                                        setPaymentMethod(e.target.value);
                                        setShowPayPal(true);
                                    }}
                                />
                                PayPal
                            </label>
                        </div>
                    </div>

                    {orderError && <p className="error-message">{orderError}</p>}

                    {paymentMethod === 'credit_card' && (
                        <button type="submit" className="place-order-button" disabled={isPlacingOrder}>
                            {isPlacingOrder ? 'Placing Order...' : `Place Order (${formatPrice(total, currency)})`}
                        </button>
                    )}

                    {paymentMethod === 'paypal' && (
                        <div className="paypal-container">
                            <div className="paypal-payment-info">
                                <p>PayPal payment for: {formatPrice(total, currency)}</p>
                            </div>
                            
                            {paypalLoading && (
                                <div className="paypal-loading">
                                    <p>Loading PayPal...</p>
                                </div>
                            )}
                            
                            <PayPalButtons
                                createOrder={(data, actions) => {
                                    console.log('Creating PayPal order for:', total);
                                    setPaypalLoading(true);
                                    return actions.order.create({
                                        purchase_units: [
                                            {
                                                amount: {
                                                    value: total.toString(),
                                                    currency_code: "USD"
                                                },
                                                description: `TechStock Order - ${cartItems.length} items`
                                            }
                                        ]
                                    });
                                }}
                                onApprove={(data, actions) => {
                                    console.log('PayPal order approved:', data);
                                    setPaypalLoading(false);
                                    return actions.order.capture().then((details) => {
                                        console.log('PayPal payment captured:', details);
                                        handlePayPalPayment(details);
                                    });
                                }}
                                onError={(err) => {
                                    console.error('PayPal error:', err);
                                    setPaypalLoading(false);
                                    setOrderError('PayPal payment failed. Please try again or use a different payment method.');
                                    // Cancel the order if it was created
                                    if (paypalOrderId) {
                                        handleOrderCancellation(paypalOrderId);
                                        setPaypalOrderId(null);
                                    }
                                }}
                                onCancel={() => {
                                    console.log('PayPal payment cancelled by user');
                                    setPaypalLoading(false);
                                    setOrderError('Payment was cancelled. You can try again or choose a different payment method.');
                                    // Cancel the order if it was created
                                    if (paypalOrderId) {
                                        handleOrderCancellation(paypalOrderId);
                                        setPaypalOrderId(null);
                                    }
                                }}
                                onInit={() => {
                                    console.log('PayPal initialized');
                                    setPaypalLoading(false);
                                }}
                                style={{ layout: "horizontal" }}
                            />
                            
                            <div className="paypal-help">
                                <p>If PayPal button doesn't appear:</p>
                                <ul>
                                    <li>Refresh the page and try again</li>
                                    <li>Check your internet connection</li>
                                    <li>Try a different browser</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Checkout; 