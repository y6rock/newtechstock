import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaTag, FaTimes } from 'react-icons/fa';
import { formatPrice } from '../utils/currency';
import './Cart.css';

const Cart = () => {
  const { 
    cartItems, removeFromCart, updateQuantity, clearCart, 
    appliedPromotion, discountAmount, applyPromotion, removePromotion,
    subtotal, subtotalAfterDiscount, vatAmount, netAmount, vat_rate, total 
  } = useCart();
  const { currency } = useSettings();
  const [promotionCode, setPromotionCode] = useState('');
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const [promotionError, setPromotionError] = useState('');

  const handleApplyPromotion = async () => {
    if (!promotionCode.trim()) {
      setPromotionError('Please enter a promotion code.');
      return;
    }
    setIsApplyingPromotion(true);
    setPromotionError('');
    try {
      await applyPromotion(promotionCode);
    } catch (error) {
      setPromotionError(error.response?.data?.message || 'Failed to apply promotion code.');
    } finally {
      setIsApplyingPromotion(false);
    }
  };

  const handleRemovePromotion = () => {
    removePromotion();
    setPromotionCode('');
    setPromotionError('');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container empty-cart">
        <h1>Your Shopping Cart</h1>
        <p>Your cart is currently empty.</p>
        <Link to="/products" className="start-shopping-button">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Your Shopping Cart</h1>
      <div className="cart-content">
        <div className="cart-items-list">
          {cartItems.map(item => (
            <div key={item.product_id} className="cart-item">
              <div className="cart-item-image">
                <img
                  src={item.image && item.image.startsWith('/uploads') ? `http://localhost:3001${item.image}` : item.image || 'https://via.placeholder.com/150'}
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150';
                  }}
                />
              </div>
              <div className="cart-item-details">
                <h3>{item.name}</h3>
                <p className="cart-item-price">{formatPrice(item.price, currency)}</p>
                <div className="cart-item-quantity">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                </div>
              </div>
              <div className="cart-item-subtotal">
                <p>{formatPrice(item.price * item.quantity, currency)}</p>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.product_id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h2>Cart Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="summary-row discount">
              <span>Discount ({appliedPromotion.name})</span>
              <span>-{formatPrice(discountAmount, currency)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="summary-row">
              <span>Subtotal after discount</span>
              <span>{formatPrice(subtotalAfterDiscount, currency)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Net Amount (excluding VAT)</span>
            <span>{formatPrice(netAmount, currency)}</span>
          </div>
          <div className="summary-row">
            <span>VAT ({vat_rate}%)</span>
            <span>{formatPrice(vatAmount, currency)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>FREE</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(total, currency)}</span>
          </div>
          <Link to="/checkout" className="checkout-button">Proceed to Checkout</Link>
          <button className="clear-cart-button" onClick={clearCart}>Clear Cart</button>
        </div>
      </div>
      <div className="promotion-section">
        <h3><FaTag /> Have a Promotion Code?</h3>
        {appliedPromotion ? (
          <div className="applied-promotion">
            <div>
              <strong>Applied: {appliedPromotion.name}</strong>
              <p>Code: {appliedPromotion.code}</p>
            </div>
            <button onClick={handleRemovePromotion}><FaTimes /></button>
          </div>
        ) : (
          <div className="promotion-form">
            <input
              type="text"
              value={promotionCode}
              onChange={(e) => setPromotionCode(e.target.value)}
              placeholder="Enter code"
              disabled={isApplyingPromotion}
            />
            <button onClick={handleApplyPromotion} disabled={isApplyingPromotion}>
              {isApplyingPromotion ? 'Applying...' : 'Apply'}
            </button>
          </div>
        )}
        {promotionError && <p className="error-message">{promotionError}</p>}
      </div>
    </div>
  );
};

export default Cart;