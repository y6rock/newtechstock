import React from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const FloatingCart = () => {
  const { cartItems } = useCart();
  const { user_id } = useSettings();
  const navigate = useNavigate();
  const [showFloating, setShowFloating] = useState(true);

  useEffect(() => {
    if (!user_id) {
      setShowFloating(false);
      return;
    }
    
    // Wait a bit for the DOM to be ready
    const timer = setTimeout(() => {
      if (!window.cartTabRef || !window.cartTabRef.current) {
        console.log('FloatingCart: Cart tab ref not found, showing floating cart');
        setShowFloating(true);
        return;
      }
      
      const cartTabEl = window.cartTabRef.current;
      console.log('FloatingCart: Setting up observer for cart tab:', cartTabEl);
      
      const observer = new window.IntersectionObserver(
        ([entry]) => {
          console.log('FloatingCart: Cart tab intersection:', entry.isIntersecting);
          setShowFloating(!entry.isIntersecting);
        },
        { 
          threshold: 0.1,
          rootMargin: '0px 0px -10px 0px' // Slight offset to trigger earlier
        }
      );
      
      observer.observe(cartTabEl);
      return () => {
        console.log('FloatingCart: Disconnecting observer');
        observer.disconnect();
      };
    }, 100);
    
    return () => clearTimeout(timer);
  }, [user_id]);

  if (!user_id || !showFloating) return null; // Only show if logged in and cart tab not visible

  const itemCount = cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return (
    <div
      onClick={() => navigate('/cart')}
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 1000,
        background: '#fff',
        borderRadius: '50%',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        overflow: 'visible',
      }}
      title="View Cart"
    >
      <FaShoppingCart size={32} color="#1976D2" />
      {itemCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          background: '#ff5252',
          color: '#fff',
          borderRadius: '50%',
          padding: '2px 8px',
          fontSize: '0.95em',
          fontWeight: 'bold',
          minWidth: '24px',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
        }}>{itemCount}</span>
      )}
    </div>
  );
};

export default FloatingCart; 