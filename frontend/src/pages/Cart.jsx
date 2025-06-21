import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaTag, FaTimes } from 'react-icons/fa';
import './shared.css'; // Import shared styles

const Cart = () => {
  const { cartItems, removeFromCart, updateCartQuantity, clearCart, getTotalPrice } = useCart();
  const [settings, setSettings] = useState({ currency: 'ILS' });
  const [currencies, setCurrencies] = useState({});
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const [promotionError, setPromotionError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, currenciesRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/currencies')
        ]);
        setSettings(settingsRes.data);
        setCurrencies(currenciesRes.data);
      } catch (err) {
        // ignore
      }
    };
    fetchSettings();
  }, []);

  const formatPrice = (price) => {
    const currency = currencies[settings.currency];
    if (!currency) return `₪${parseFloat(price).toFixed(2)}`;
    const convertedPrice = price * currency.rate;
    return `${currency.symbol}${convertedPrice.toFixed(2)}`;
  };

  const applyPromotion = async () => {
    if (!promotionCode.trim() || cartItems.length === 0) {
      setPromotionError('Please enter a promotion code and ensure your cart is not empty');
      return;
    }

    setIsApplyingPromotion(true);
    setPromotionError('');

    try {
      const response = await axios.post('/api/promotions/apply', {
        promotionCode: promotionCode.trim(),
        cartItems: cartItems.map(item => ({
          product_id: item.product_id,
          price: parseFloat(item.price),
          quantity: item.quantity,
          category_id: item.category_id
        }))
      });

      setAppliedPromotion(response.data.promotion);
      setDiscountAmount(response.data.totalDiscount);
      setPromotionError('');
    } catch (error) {
      setPromotionError(error.response?.data?.message || 'Failed to apply promotion code');
      setAppliedPromotion(null);
      setDiscountAmount(0);
    } finally {
      setIsApplyingPromotion(false);
    }
  };

  const removePromotion = () => {
    setAppliedPromotion(null);
    setDiscountAmount(0);
    setPromotionCode('');
    setPromotionError('');
  };

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const finalTotal = total - discountAmount;

  if (cartItems.length === 0) {
    return (
      <div className="simple-page-container" style={{ textAlign: 'center' }}>
        <h1>Your Shopping Cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '20px', textAlign: 'center', color: '#333' }}>Your Shopping Cart</h1>

      <div>
        {cartItems.map(item => (
          <div key={item.product_id} style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #eee',
            paddingBottom: '20px'
          }}>
            <img
              src={item.image.startsWith('/uploads') ? `http://localhost:3001${item.image}` : item.image}
              alt={item.name}
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px', marginRight: '20px' }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1em' }}>{item.name}</h3>
              <p style={{ margin: '0 0 10px 0', color: '#555' }}>{formatPrice(parseFloat(item.price))}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px' }}>
              <button
                onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >-</button>
              <span style={{ fontSize: '1.1em', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
              <button
                onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >+</button>
            </div>
            <button
              onClick={() => removeFromCart(item.product_id)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >Remove</button>
          </div>
        ))}

        {/* Promotion Code Section */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaTag /> Promotion Code
          </h3>
          
          {appliedPromotion ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: '#d4edda',
              borderRadius: '6px',
              border: '1px solid #c3e6cb'
            }}>
              <div>
                <strong style={{ color: '#155724' }}>Applied: {appliedPromotion.name}</strong>
                <p style={{ margin: '5px 0 0 0', color: '#155724', fontSize: '14px' }}>
                  Code: {appliedPromotion.code} - Discount: {formatPrice(discountAmount)}
                </p>
              </div>
              <button
                onClick={removePromotion}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#721c24',
                  cursor: 'pointer',
                  padding: '5px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                <input
                  type="text"
                  value={promotionCode}
                  onChange={(e) => setPromotionCode(e.target.value)}
                  placeholder="Enter promotion code"
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && applyPromotion()}
                />
                <button
                  onClick={applyPromotion}
                  disabled={isApplyingPromotion || !promotionCode.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isApplyingPromotion ? 'not-allowed' : 'pointer',
                    opacity: isApplyingPromotion ? 0.6 : 1
                  }}
                >
                  {isApplyingPromotion ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {promotionError && (
                <p style={{ color: '#dc3545', fontSize: '12px', margin: '5px 0 0 0' }}>
                  {promotionError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Subtotal:</span>
            <span>{formatPrice(total)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#28a745' }}>
              <span>Discount:</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '1px solid #dee2e6',
            fontSize: '1.2em',
            fontWeight: 'bold'
          }}>
            <span>Total:</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <button
            onClick={clearCart}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >Clear Cart</button>
          <Link to="/checkout" style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: '#fff',
            textDecoration: 'none',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'inline-block',
            textAlign: 'center'
          }}>
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;