import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Cart = () => {
  const { cartItems, removeFromCart, updateCartQuantity, clearCart, getTotalPrice } = useCart();
  const [settings, setSettings] = useState({ currency: 'ILS' });
  const [currencies, setCurrencies] = useState({});

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

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '20px', textAlign: 'center', color: '#333' }}>Your Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <p style={{ fontSize: '1.2em', marginBottom: '20px' }}>Your cart is empty.</p>
          <Link to="/products" style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '5px',
            fontSize: '1em'
          }}>Start Shopping</Link>
        </div>
      ) : (
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h2 style={{ margin: '0', fontSize: '1.5em', marginRight: '20px' }}>Total: {formatPrice(parseFloat(getTotalPrice()))}</h2>
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
      )}
    </div>
  );
};

export default Cart;