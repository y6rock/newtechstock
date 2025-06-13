import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user_id, username } = useSettings();
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

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', display: 'flex', gap: 40, alignItems: 'flex-start', fontFamily: 'Arial, sans-serif' }}>
      <button onClick={() => navigate(-1)} style={{ position: 'absolute', left: 30, top: 30, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '1em' }}>&lt; Back to all products</button>
      <img
        src={
          product.image
            ? product.image.startsWith('/uploads')
              ? `http://localhost:3001${product.image}`
              : product.image
            : ''
        }
        alt={product.name}
        style={{ width: 400, height: 400, objectFit: 'cover', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
      />
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: 10 }}>{product.name}</h2>
        <div style={{ color: '#888', marginBottom: 10 }}>By {product.brand || 'Unknown'}</div>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: 15 }}>${product.price}</div>
        <div style={{ color: '#444', marginBottom: 20 }}>{product.description}</div>
        <div style={{ color: product.stock > 0 ? 'green' : 'red', marginBottom: 20 }}>
          {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span>Quantity:</span>
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ padding: '5px 12px', fontSize: '1.1em', borderRadius: 4, border: '1px solid #ddd', background: '#f3f4f6', cursor: 'pointer' }}>-</button>
          <span style={{ minWidth: 30, textAlign: 'center' }}>{quantity}</span>
          <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} style={{ padding: '5px 12px', fontSize: '1.1em', borderRadius: 4, border: '1px solid #ddd', background: '#f3f4f6', cursor: 'pointer' }}>+</button>
        </div>
        <button
          style={{ padding: '12px 0', width: 250, background: '#111827', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: '1em', cursor: product.stock > 0 ? 'pointer' : 'not-allowed', opacity: product.stock > 0 ? 1 : 0.6 }}
          disabled={product.stock === 0}
          onClick={handleAddToCart}
        >
          Add to Cart
        </button>
        {cartMsg && <div style={{ marginTop: 15, color: cartMsg.includes('Added') ? 'green' : 'red' }}>{cartMsg}</div>}
      </div>
    </div>
  );
} 