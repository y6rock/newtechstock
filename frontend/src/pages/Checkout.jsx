import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import axios from 'axios';

const Checkout = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user_id, username } = useSettings();
  const navigate = useNavigate();
  const [paymentSimulated, setPaymentSimulated] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [settings, setSettings] = useState({ currency: 'ILS', taxRate: 17 });
  const [currencies, setCurrencies] = useState({});

  useEffect(() => {
    // Redirect if cart is empty or user is not logged in
    if (cartItems.length === 0) {
      navigate('/cart');
    }
    if (!user_id) {
      navigate('/login');
    }
  }, [cartItems, user_id, navigate]);

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
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSimulatePayment = () => {
    setPaymentSimulated(true);
    alert('Payment simulated successfully! You can now place your order.');
  };

  const formatPrice = (price) => {
    const currency = currencies[settings.currency];
    if (!currency) return `₪${price.toFixed(2)}`; // Default to shekel if currency not found
    
    const convertedPrice = price * currency.rate;
    return `${currency.symbol}${convertedPrice.toFixed(2)}`;
  };

  const handlePlaceOrder = async () => {
    if (!paymentSimulated) {
      alert('Please simulate payment first.');
      return;
    }
    if (cartItems.length === 0) {
      alert('Your cart is empty. Cannot place an empty order.');
      navigate('/cart');
      return;
    }
    if (!user_id) {
      alert('You must be logged in to place an order.');
      navigate('/login');
      return;
    }

    setLoadingOrder(true);
    setOrderError(null);

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        user_id: user_id,
        total_amount: parseFloat(getTotalPrice()),
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
      };

      console.log('Placing order with data:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
        throw new Error(errorDetails.message || 'Failed to place order.');
      }

      const result = await response.json();
      console.log('Order placed successfully:', result);
      alert('Order placed successfully!');
      clearCart();
      navigate('/order-confirmation');

    } catch (error) {
      console.error('Error placing order:', error);
      setOrderError(`Error placing order: ${error.message}`);
      alert(`Error placing order: ${error.message}`);
    } finally {
      setLoadingOrder(false);
    }
  };

  const subtotal = parseFloat(getTotalPrice());
  const vatRate = settings.taxRate || 0;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '20px', textAlign: 'center', color: '#333' }}>Checkout</h1>

      {cartItems.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Redirecting to cart...</p>
      ) : (
        <div>
          <h2 style={{ fontSize: '1.5em', marginBottom: '15px', color: '#555' }}>Order Summary</h2>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {cartItems.map(item => (
              <li key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #eee' }}>
                <span>{item.name} (x{item.quantity})</span>
                <span>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#666' }}>
              <span>VAT ({vatRate}%):</span>
              <span>{formatPrice(vatAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.5em', marginTop: '30px', marginBottom: '15px', color: '#555' }}>Payment</h2>
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#777' }}>This is a sandbox payment module. Click to simulate payment.</p>
            {!paymentSimulated ? (
              <button
                onClick={handleSimulatePayment}
                style={{
                  padding: '12px 25px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '1.1em',
                  marginTop: '10px'
                }}
              >Simulate Payment</button>
            ) : (
              <p style={{ color: '#28a745', fontWeight: 'bold' }}>Payment Simulated!</p>
            )}
          </div>

          {orderError && <p style={{ color: 'red', textAlign: 'center', marginTop: '15px' }}>{orderError}</p>}

          <button
            onClick={handlePlaceOrder}
            disabled={!paymentSimulated || loadingOrder || cartItems.length === 0}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: paymentSimulated ? '#28a745' : '#cccccc',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: paymentSimulated ? 'pointer' : 'not-allowed',
              fontSize: '1.2em',
              marginTop: '30px',
              opacity: loadingOrder ? 0.7 : 1
            }}
          >
            {loadingOrder ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Checkout; 