import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/currency';

// Helper to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€',
  };
  return symbols[currencyCode] || '$';
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user_id, username, currency } = useSettings();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    setCartMsg('');
    if (!user_id) {
      setCartMsg('Please log in to add items to your cart.');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    addToCart(product, quantity);
    setCartMsg('Added to cart!');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Loading...</div>;
  if (!product) return <div style={{ textAlign: 'center', marginTop: 50 }}>Product not found.</div>;

  // Enhanced inventory validation
  const hasValidStock = product.stock && product.stock >= 0;
  const isOutOfStock = !hasValidStock || product.stock === 0;
  const stockStatus = !hasValidStock ? 'Invalid Stock Data' : product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock} available)`;
  const stockColor = !hasValidStock ? '#ff6b35' : product.stock === 0 ? '#dc3545' : '#28a745';

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', gap: 40, alignItems: 'flex-start', fontFamily: 'Arial, sans-serif' }}>
      <button onClick={() => navigate(-1)} style={{ position: 'absolute', left: 30, top: 30, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '1em' }}>&lt; Back to all products</button>
      <div className="product-image-container">
        <img
          src={
            product.image
              ? product.image && product.image.startsWith('/uploads')
                ? `http://localhost:3001${product.image}`
                : product.image
              : 'https://via.placeholder.com/400'
          }
          alt={product.name}
          className="product-main-image"
        />
      </div>
      <div className="product-info-container">
        <h1 className="product-title">{product.name}</h1>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: 15 }}>{formatPrice(product.price, currency)}</div>
        <p className="product-description">{product.description}</p>
        <div className="product-stock-status">
          <span style={{ color: stockColor, fontWeight: 'bold' }}>
            {stockStatus}
          </span>
        </div>
        {hasValidStock && product.stock > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span>Quantity:</span>
            <button 
              onClick={() => setQuantity(q => Math.max(1, q - 1))} 
              style={{ 
                padding: '5px 12px', 
                fontSize: '1.1em', 
                borderRadius: 4, 
                border: '1px solid #ddd', 
                background: '#f3f4f6', 
                cursor: 'pointer'
              }}
            >-</button>
            <span style={{ minWidth: 30, textAlign: 'center' }}>{quantity}</span>
            <button 
              onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} 
              style={{ 
                padding: '5px 12px', 
                fontSize: '1.1em', 
                borderRadius: 4, 
                border: '1px solid #ddd', 
                background: '#f3f4f6', 
                cursor: 'pointer'
              }}
            >+</button>
          </div>
        )}
        <button
          style={{ 
            padding: '12px 0', 
            width: 250, 
            background: isOutOfStock ? '#6c757d' : '#111827', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6, 
            fontWeight: 'bold', 
            fontSize: '1em', 
            cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
            opacity: isOutOfStock ? 0.6 : 1 
          }}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          title={!hasValidStock ? 'Invalid stock data' : product.stock === 0 ? 'Out of stock' : 'Add to cart'}
        >
          {!hasValidStock ? 'Invalid Stock' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
        {cartMsg && <div style={{ marginTop: 15, color: cartMsg.includes('Added') ? 'green' : 'red' }}>{cartMsg}</div>}
      </div>
    </div>
  );
} 