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

  // Load cart from server session when component mounts or user_id changes
  useEffect(() => {
    if (!isInitialMount.current) {
      loadCartFromServer();
    }
    isInitialMount.current = false;
  }, [user_id]);

  // Also load cart on every mount to handle Safari session issues
  useEffect(() => {
    loadCartFromServer();
  }, []);

  // Safari-specific cart loading with aggressive fallback
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      // For Safari, try localStorage backup first, then server
      const cartBackup = localStorage.getItem('cart_backup');
      if (cartBackup) {
        try {
          const backupData = JSON.parse(cartBackup);
          // Use backup if it's less than 24 hours old
          if (Date.now() - backupData.timestamp < 24 * 60 * 60 * 1000) {
            console.log('Safari: Loading cart from localStorage backup');
            setCartItems(backupData.cartItems || []);
            setAppliedPromotion(backupData.appliedPromotion);
            setDiscountAmount(backupData.discountAmount || 0);
          }
        } catch (error) {
          console.error('Safari: Error loading cart backup:', error);
        }
      }
      
      // Still try to sync with server
      setTimeout(() => {
        loadCartFromServer();
      }, 1000);
    }
  }, []);

  // Load cart from server session
  const loadCartFromServer = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/session-cart', {
        withCredentials: true // Important for session cookies
      });

      const { cartItems: serverCartItems, appliedPromotion: serverPromotion, discountAmount: serverDiscount, sessionId } = response.data;
      
      setCartItems(serverCartItems || []);
      setAppliedPromotion(serverPromotion);
      setDiscountAmount(serverDiscount || 0);

      // Store cart data in localStorage as backup for Safari
      if (serverCartItems && serverCartItems.length > 0) {
        localStorage.setItem('cart_backup', JSON.stringify({
          cartItems: serverCartItems,
          appliedPromotion: serverPromotion,
          discountAmount: serverDiscount || 0,
          sessionId: sessionId,
          timestamp: Date.now()
        }));
      }

    } catch (error) {
      console.error('Error loading cart from server:', error);
      
      // Safari fallback: try to load from localStorage backup
      if (error.response?.status === 401 || error.response?.status === 403) {
        try {
          const cartBackup = localStorage.getItem('cart_backup');
          if (cartBackup) {
            const backupData = JSON.parse(cartBackup);
            // Only use backup if it's less than 24 hours old
            if (Date.now() - backupData.timestamp < 24 * 60 * 60 * 1000) {
              console.log('Using Safari cart backup from localStorage');
              setCartItems(backupData.cartItems || []);
              setAppliedPromotion(backupData.appliedPromotion);
              setDiscountAmount(backupData.discountAmount || 0);
              setIsLoading(false);
              return;
            }
          }
        } catch (backupError) {
          console.error('Error loading cart backup:', backupError);
        }
      }
      
      // Don't show error for auth issues during initial load
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Failed to load cart:', error.response?.data?.message || error.message);
      }
      // Initialize empty cart on error
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Cart validation and synchronization function
  const validateCart = async (showNotifications = true) => {
    if (cartItems.length === 0) return;

    const now = Date.now();
    if (now - lastValidationTime.current < 60000) { // Throttle to once per minute
      return;
    }
    lastValidationTime.current = now;

    setIsValidating(true);
    try {
      const response = await axios.post('/api/session-cart/validate', {
        cartItems: cartItems
      }, {
        withCredentials: true
      });

      const { validatedCart, changes, removedItems } = response.data;

      if (changes.length > 0 || removedItems.length > 0) {
        setCartItems(validatedCart);

        if (showNotifications) {
          if (changes.length > 0) {
            const changeMessages = changes.map(change => 
              `${change.name}: ${change.change}`
            ).join(', ');
            showInfo(`Cart updated: ${changeMessages}`);
          }

          if (removedItems.length > 0) {
            const removedNames = removedItems.map(item => item.name).join(', ');
            showError(`Removed from cart (no longer available): ${removedNames}`);
          }
        }
      }
    } catch (error) {
      console.error('Error validating cart:', error);
      if (showNotifications) {
        showError('Failed to validate cart items');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Validate cart when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCart(false); // Don't show notifications during auto-validation
    }
  }, [cartItems.length, validateCart]);

  // Add to cart - now uses session-based API
  const addToCart = async (product, quantity = 1) => {
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

    try {
      const response = await axios.post('/api/session-cart/add', {
        product_id: product.product_id,
        quantity: quantity
      }, {
        withCredentials: true
      });

      // Update local state with server response
      const updatedCartItems = response.data.cartItems || [];
      setCartItems(updatedCartItems);
      
      // Update localStorage backup for Safari
      localStorage.setItem('cart_backup', JSON.stringify({
        cartItems: updatedCartItems,
        appliedPromotion: appliedPromotion,
        discountAmount: discountAmount,
        timestamp: Date.now()
      }));
      
      showSuccess(`Added ${quantity} ${product.name} to cart!`);

    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to add item to cart');
      }
    }
  };

  // Remove from cart - now uses session-based API
  const removeFromCart = async (productId) => {
    try {
      const response = await axios.delete('/api/session-cart/remove', {
        data: { product_id: productId },
        withCredentials: true
      });

      // Update local state with server response
      setCartItems(response.data.cartItems || []);
      showSuccess('Item removed from cart');

    } catch (error) {
      console.error('Error removing from cart:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to remove item from cart');
      }
    }
  };

  // Update quantity - now uses session-based API
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 0) {
      showError('Quantity cannot be negative');
      return;
    }

    try {
      const response = await axios.put('/api/session-cart/update', {
        product_id: productId,
        quantity: newQuantity
      }, {
        withCredentials: true
      });

      // Update local state with server response
      setCartItems(response.data.cartItems || []);

      if (newQuantity === 0) {
        showSuccess('Item removed from cart');
      }

    } catch (error) {
      console.error('Error updating quantity:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to update quantity');
      }
    }
  };

  // Clear cart - now uses session-based API
  const clearCart = async () => {
    try {
      await axios.delete('/api/session-cart/clear', {
        withCredentials: true
      });

      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
      showSuccess('Cart cleared successfully');

    } catch (error) {
      console.error('Error clearing cart:', error);
      showError('Failed to clear cart');
    }
  };

  // Apply promotion - now uses session-based API
  const applyPromotion = async (promotionCode) => {
    try {
      const response = await axios.post('/api/cart/promotion', {
        code: promotionCode
      }, {
        withCredentials: true
      });

      const { appliedPromotion: newPromotion, discountAmount: newDiscount } = response.data;
      setAppliedPromotion(newPromotion);
      setDiscountAmount(newDiscount || 0);

      if (newPromotion) {
        showSuccess(`Promotion "${newPromotion.name}" applied successfully!`);
      } else {
        showError('Invalid promotion code');
      }

    } catch (error) {
      console.error('Error applying promotion:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError('Failed to apply promotion');
      }
    }
  };

  // Remove promotion - now uses session-based API
  const removePromotion = async () => {
    try {
      await axios.delete('/api/cart/promotion', {
        withCredentials: true
      });

      setAppliedPromotion(null);
      setDiscountAmount(0);
      showSuccess('Promotion removed successfully');

    } catch (error) {
      console.error('Error removing promotion:', error);
      showError('Failed to remove promotion');
    }
  };

  // Refresh cart from server
  const refreshCart = async () => {
    await loadCartFromServer();
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const netAmount = subtotal - discountAmount;
  const vatAmount = netAmount * (vat_rate / 100);
  const total = netAmount + vatAmount;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cartItems,
    appliedPromotion,
    discountAmount,
    subtotal,
    netAmount,
    vatAmount,
    total,
    totalItems,
    isLoading,
    isValidating,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyPromotion,
    removePromotion,
    refreshCart,
    validateCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};