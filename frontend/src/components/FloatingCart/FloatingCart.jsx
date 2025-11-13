import React from 'react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './FloatingCart.css';

const FloatingCart = () => {
  const { cartItems } = useCart();
  const { user_id, isUserAdmin } = useSettings();
  const navigate = useNavigate();
  const [showFloating, setShowFloating] = useState(true);

  useEffect(() => {
    if (!user_id || isUserAdmin) {
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
  }, [user_id, isUserAdmin]);

  if (!user_id || isUserAdmin || !showFloating) return null; // Only show if logged in, not admin, and cart tab not visible

  const itemCount = cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return (
    <div
      onClick={() => navigate('/cart')}
      className="floating-cart"
      title="View Cart"
    >
      <FaShoppingCart size={32} className="cart-icon" />
      {itemCount > 0 && (
        <span className="cart-badge">{itemCount}</span>
      )}
    </div>
  );
};

export default FloatingCart; 