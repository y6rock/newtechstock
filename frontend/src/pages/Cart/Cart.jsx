import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaTag, FaTimes, FaSync } from 'react-icons/fa';
import { formatPrice, formatPriceConverted, formatPriceWithTax } from '../../utils/currency';
import './Cart.css';

const Cart = () => {
  const { 
    cartItems, removeFromCart, updateQuantity, clearCart, 
    appliedPromotion, discountAmount, applyPromotion, removePromotion,
    validateCart, refreshCart, isValidating,
    subtotal, subtotalAfterDiscount, vatAmount, netAmount, vat_rate, total 
  } = useCart();
  const { currency, username, user_id } = useSettings();
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
      <div className="cart-container cart-container--empty">
        <div className="empty-cart">
          <h1>Your Shopping Cart</h1>
          <p>Your cart is currently empty.</p>
          <Link to="/products" className="start-shopping-button">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Your Shopping Cart</h1>
        {username && user_id && cartItems.length > 0 && (
          <button 
            onClick={async () => {
              await refreshCart();
              await validateCart(true, true); // Force validation (bypass throttling)
            }}
            className="cart-refresh-button"
            disabled={isValidating}
            title="Refresh cart items and prices"
          >
            <FaSync className={isValidating ? 'spinning' : ''} />
            {isValidating ? 'Updating...' : 'Refresh'}
          </button>
        )}
      </div>
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
                <p className="cart-item-price">{formatPriceConverted(item.price, currency)}</p>
                <div className="cart-item-quantity">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                </div>
              </div>
              <div className="cart-item-subtotal">
                <p>{formatPriceConverted(item.price * item.quantity, currency)}</p>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.product_id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h2>Cart Summary</h2>
          {discountAmount > 0 && (
            <div className="summary-row discount">
              <span>Discount ({appliedPromotion.name})</span>
              <span>-{formatPriceConverted(discountAmount, currency)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Net Amount (excluding VAT)</span>
            <span>{formatPriceConverted(netAmount, currency)}</span>
          </div>
          <div className="summary-row">
            <span>VAT Rate: {vat_rate}%</span>
            <span>{formatPriceConverted(vatAmount, currency)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>FREE</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPriceConverted(total, currency)}</span>
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