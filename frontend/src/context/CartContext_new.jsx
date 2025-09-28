import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user_id, vat_rate } = useSettings();
  const { showSuccess, showError, showInfo } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialMount = useRef(true);
  const lastValidationTime = useRef(0);

  // Load cart from server when user_id changes
  useEffect(() => {
    if (user_id && !isInitialMount.current) {
      loadCartFromServer();
    }
    isInitialMount.current = false;
  }, [user_id]);

  // Load cart from server
  const loadCartFromServer = async () => {
    if (!user_id) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await axios.get('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const { cartItems: serverCartItems, appliedPromotion: serverPromotion, discountAmount: serverDiscount } = response.data;
      
      setCartItems(serverCartItems || []);
      setAppliedPromotion(serverPromotion);
      setDiscountAmount(serverDiscount || 0);

    } catch (error) {
      console.error('Error loading cart from server:', error);
      // Don't show error for auth issues during initial load
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Failed to load cart:', error.response?.data?.message || error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cart validation and synchronization function (unchanged logic)
  const validateCart = async (showNotifications = true) => {
    if (!user_id || cartItems.length === 0 || isValidating) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const now = Date.now();
    if (now - lastValidationTime.current < 30000) {
      return;
    }

    setIsValidating(true);
    lastValidationTime.current = now;

    try {
      const response = await axios.post('/api/cart/validate', {
        cartItems: cartItems
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const { validatedCart, changes, removedItems, summary } = response.data;

      if (validatedCart.length !== cartItems.length || changes.length > 0) {
        setCartItems(validatedCart);
      }

      if (showNotifications) {
        if (removedItems.length > 0) {
          const removedNames = removedItems.map(item => item.name).join(', ');
          showError(`${removedItems.length} item(s) removed from cart: ${removedNames}`);
        }
        const priceChanges = changes.filter(change => 
          change.changes.some(c => c.field === 'price')
        );
        if (priceChanges.length > 0) {
          showInfo(`Prices updated for ${priceChanges.length} item(s) in your cart`);
        }
        const quantityChanges = changes.filter(change => 
          change.changes.some(c => c.field === 'quantity')
        );
        if (quantityChanges.length > 0) {
          showInfo(`Quantities adjusted for ${quantityChanges.length} item(s) due to stock limits`);
        }
      }

      console.log('Cart validation completed:', summary);

    } catch (error) {
      console.error('Cart validation failed:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Cart validation skipped: Authentication required');
        if (showNotifications && user_id) {
          showInfo('Session expired. Please log in again to validate cart items');
        }
      } else if (error.response?.status >= 500) {
        console.log('Server error during cart validation');
        if (showNotifications) {
          showError('Server temporarily unavailable. Please try again later.');
        }
      } else if (showNotifications && error.response) {
        const errorMessage = error.response?.data?.message || `Server error (${error.response.status})`;
        showError(errorMessage);
      } else if (showNotifications && !error.response) {
        showError('Unable to connect to server. Please check your connection.');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Validate cart on initial load and when user_id changes
  useEffect(() => {
    if (user_id && cartItems.length > 0 && !isInitialMount.current) {
      const timer = setTimeout(() => {
        validateCart(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user_id]);

  // Validate cart when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user_id && cartItems.length > 0 && localStorage.getItem('token')) {
        const now = Date.now();
        if (now - lastValidationTime.current > 60000) {
          validateCart(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user_id, cartItems.length]);

  // Add to cart - now uses server API
  const addToCart = async (product, quantity = 1) => {
    if (!user_id) {
      showError('Please log in to add items to your cart.');
      return;
    }
    
    if (!product.stock || product.stock < 0) {
      showError('This product has invalid inventory data and cannot be added to cart.');
      return;
    }
    
    if (product.stock === 0) {
      showError('This product is out of stock and cannot be added to cart.');
      return;
    }
    
    if (!quantity || quantity <= 0) {
      showError('Please select a valid quantity.');
      return;
    }
    
    if (quantity > product.stock) {
      showError(`Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available. Cannot add ${quantity} to cart.`);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showError('Please log in to add items to your cart.');
      return;
    }

    try {
      await axios.post('/api/cart/add', {
        product_id: product.product_id,
        quantity: quantity,
        price: product.price
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Reload cart from server to get updated state
      await loadCartFromServer();
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      const message = error.response?.data?.message || 'Failed to add item to cart';
      showError(message);
    }
  };

  // Remove from cart - now uses server API
  const removeFromCart = async (productId) => {
    if (!user_id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete('/api/cart/remove', {
        data: { product_id: productId },
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update local state immediately for better UX
      setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
      
    } catch (error) {
      console.error('Error removing from cart:', error);
      const message = error.response?.data?.message || 'Failed to remove item from cart';
      showError(message);
      
      // Reload cart from server on error to sync state
      await loadCartFromServer();
    }
  };

  // Update quantity - now uses server API
  const updateQuantity = async (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) {
      showError('Please enter a valid quantity (minimum 1).');
      return;
    }
    
    if (!user_id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const item = cartItems.find(item => item.product_id === productId);
    if (!item) return;
    
    if (!item.stock || item.stock < 0) {
      showError('This product has invalid inventory data.');
      return;
    }
    
    if (quantity > item.stock) {
      showError(`Only ${item.stock} unit${item.stock === 1 ? '' : 's'} available. Cannot set quantity to ${quantity}.`);
      return;
    }

    try {
      await axios.put('/api/cart/update', {
        product_id: productId,
        quantity: quantity
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update local state immediately for better UX
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product_id === productId ? { ...item, quantity: quantity } : item
        )
      );
      
    } catch (error) {
      console.error('Error updating cart:', error);
      const message = error.response?.data?.message || 'Failed to update cart item';
      showError(message);
      
      // Reload cart from server on error to sync state
      await loadCartFromServer();
    }
  };

  // Clear cart - now uses server API
  const clearCart = async () => {
    if (!user_id) {
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
      return;
    }

    try {
      await axios.delete('/api/cart/clear', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update local state immediately
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
      
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Still clear local state even if server call fails
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
    }
  };

  // Apply promotion - now uses server API
  const applyPromotion = async (promotion, calculatedDiscount) => {
    if (!user_id) {
      showError('Please log in to apply promotions.');
      return false;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showError('Please log in to apply promotions.');
      return false;
    }

    try {
      await axios.post('/api/cart/promotion/apply', {
        promotion_id: promotion.promotion_id,
        discount_amount: calculatedDiscount
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update local state
      setAppliedPromotion(promotion);
      setDiscountAmount(calculatedDiscount);
      
      return true;
      
    } catch (error) {
      console.error('Error applying promotion:', error);
      const message = error.response?.data?.message || 'Failed to apply promotion';
      showError(message);
      return false;
    }
  };

  // Remove promotion - now uses server API
  const removePromotion = async () => {
    if (!user_id) {
      setAppliedPromotion(null);
      setDiscountAmount(0);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setAppliedPromotion(null);
      setDiscountAmount(0);
      return;
    }

    try {
      await axios.delete('/api/cart/promotion/remove', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update local state
      setAppliedPromotion(null);
      setDiscountAmount(0);
      
    } catch (error) {
      console.error('Error removing promotion:', error);
      // Still update local state even if server call fails
      setAppliedPromotion(null);
      setDiscountAmount(0);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const vatAmount = (subtotalAfterDiscount * (vat_rate || 0)) / 100;
  const netAmount = subtotalAfterDiscount - vatAmount;
  const total = subtotalAfterDiscount;
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedPromotion,
        discountAmount,
        applyPromotion,
        removePromotion,
        validateCart,
        isValidating,
        isLoading,
        loadCartFromServer,
        subtotal,
        subtotalAfterDiscount,
        vatAmount,
        netAmount,
        vat_rate,
        total,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
