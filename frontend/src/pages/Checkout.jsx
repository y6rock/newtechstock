import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatPrice } from '../utils/currency';
import './Checkout.css';

const Checkout = () => {
    const { cartItems, clearCart, appliedPromotion, total, subtotal, discountAmount } = useCart();
    const { user_id, currency } = useSettings();
    const navigate = useNavigate();

    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [orderError, setOrderError] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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

            alert('Order placed successfully!');
            clearCart();
            console.log(`Navigating to /order-confirmation/${orderId}`);
            navigate(`/order-confirmation/${orderId}`);
        } catch (error) {
            const message = error.response?.data?.message || 'There was an issue placing your order.';
            console.error('Order placement error:', error);
            setOrderError(message);
            alert(`Error: ${message}`);
        } finally {
            setIsPlacingOrder(false);
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
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                Credit Card
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="paypal"
                                    checked={paymentMethod === 'paypal'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                PayPal
                            </label>
                        </div>
                    </div>

                    {orderError && <p className="error-message">{orderError}</p>}

                    <button type="submit" className="place-order-button" disabled={isPlacingOrder}>
                        {isPlacingOrder ? 'Placing Order...' : `Place Order (${formatPrice(total, currency)})`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Checkout; 