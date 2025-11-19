import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';
import { formatPriceConverted } from '../utils/currency';
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user_id, vat_rate, currency } = useSettings();
  const { showSuccess, showError, showInfo } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialMount = useRef(true);
  const lastValidationTime = useRef(0);
  const cartItemsRef = useRef(cartItems);

  // Load cart from server session when component mounts or user_id changes
  // When user_id changes, clear local cart state first, then load new user's cart
  useEffect(() => {
    if (!isInitialMount.current) {
      // Clear local cart state when user changes
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
      
      // Clear all localStorage cart backups (cleanup old user data)
      if (typeof Storage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('cart_backup_')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Load new user's cart
      loadCartFromServer();
    }
    isInitialMount.current = false;
  }, [user_id]);

  // Also load cart on every mount to handle Safari session issues
  useEffect(() => {
    loadCartFromServer();
  }, []);

  // Keep cartItemsRef in sync with cartItems
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // Safari-specific cart loading with aggressive fallback
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari && user_id) {
      // For Safari, try localStorage backup first, then server
      // Scope localStorage key by user_id to prevent cross-user cart persistence
      const cartBackupKey = `cart_backup_${user_id}`;
      const cartBackup = localStorage.getItem(cartBackupKey);
      if (cartBackup) {
        try {
          const backupData = JSON.parse(cartBackup);
          // Verify the backup is for the current user
          if (backupData.userId === user_id && Date.now() - backupData.timestamp < 24 * 60 * 60 * 1000) {
            console.log('Safari: Loading cart from localStorage backup');
            setCartItems(backupData.cartItems || []);
            setAppliedPromotion(backupData.appliedPromotion);
            setDiscountAmount(backupData.discountAmount || 0);
          } else {
            // Clear old backup if user doesn't match or expired
            localStorage.removeItem(cartBackupKey);
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
  }, [user_id]);

  // Load cart from server session
  const loadCartFromServer = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get('/api/session-cart', {
        headers,
        withCredentials: true // Important for session cookies
      });

      const { cartItems: serverCartItems, appliedPromotion: serverPromotion, discountAmount: serverDiscount, sessionId } = response.data;

      setCartItems(serverCartItems || []);
      setAppliedPromotion(serverPromotion);
      setDiscountAmount(serverDiscount || 0);

      // Store cart data in localStorage as backup for Safari (scoped by user_id)
      if (serverCartItems && serverCartItems.length > 0 && user_id) {
        const cartBackupKey = `cart_backup_${user_id}`;
        localStorage.setItem(cartBackupKey, JSON.stringify({
          cartItems: serverCartItems,
          appliedPromotion: serverPromotion,
          discountAmount: serverDiscount || 0,
          sessionId: sessionId,
          userId: user_id,
          timestamp: Date.now()
        }));
      }

    } catch (error) {
      console.error('Error loading cart from server:', error);
      
      // Safari fallback: try to load from localStorage backup (scoped by user_id)
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (user_id) {
          try {
            const cartBackupKey = `cart_backup_${user_id}`;
            const cartBackup = localStorage.getItem(cartBackupKey);
            if (cartBackup) {
              const backupData = JSON.parse(cartBackup);
              // Verify user matches and backup is less than 24 hours old
              if (backupData.userId === user_id && Date.now() - backupData.timestamp < 24 * 60 * 60 * 1000) {
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
  const validateCart = useCallback(async (showNotifications = true, force = false) => {
    // Use ref to get latest cartItems without causing dependency issues
    const currentCartItems = cartItemsRef.current;
    if (currentCartItems.length === 0) return;

    const now = Date.now();
    if (!force && now - lastValidationTime.current < 60000) { // Throttle to once per minute (unless forced)
      return;
    }
    lastValidationTime.current = now;

    setIsValidating(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.post('/api/session-cart/validate', {
        cartItems: currentCartItems
      }, {
        headers,
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
  }, [showInfo, showError]);

  // Validate cart when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCart(false); // Don't show notifications during auto-validation
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length]);

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
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.post('/api/session-cart/add', {
          product_id: product.product_id,
        quantity: quantity
      }, {
        headers,
        withCredentials: true
      });

      // Update local state with server response
      const updatedCartItems = response.data.cartItems || [];
      setCartItems(updatedCartItems);

      // Update localStorage backup for Safari (scoped by user_id)
      if (user_id) {
        const cartBackupKey = `cart_backup_${user_id}`;
        localStorage.setItem(cartBackupKey, JSON.stringify({
        cartItems: updatedCartItems,
          appliedPromotion: appliedPromotion,
          discountAmount: discountAmount,
          userId: user_id,
          timestamp: Date.now()
        }));
      }

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
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.delete('/api/session-cart/remove', {
        data: { product_id: productId },
        headers,
        withCredentials: true
      });

      // Update local state with server response
      const updatedCartItems = response.data.cartItems || [];
      setCartItems(updatedCartItems);

      // Update localStorage backup (scoped by user_id)
      if (user_id) {
        const cartBackupKey = `cart_backup_${user_id}`;
        if (updatedCartItems.length > 0) {
          localStorage.setItem(cartBackupKey, JSON.stringify({
        cartItems: updatedCartItems,
            appliedPromotion: appliedPromotion,
            discountAmount: discountAmount,
            userId: user_id,
            timestamp: Date.now()
          }));
        } else {
          // Clear backup if cart is empty
          localStorage.removeItem(cartBackupKey);
        }
      }

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
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.put('/api/session-cart/update', {
        product_id: productId,
        quantity: newQuantity
      }, {
        headers,
        withCredentials: true
      });

      // Update local state with server response
      const updatedCartItems = response.data.cartItems || [];
      setCartItems(updatedCartItems);

      // Update localStorage backup (scoped by user_id)
      if (user_id) {
        const cartBackupKey = `cart_backup_${user_id}`;
        if (updatedCartItems.length > 0) {
          localStorage.setItem(cartBackupKey, JSON.stringify({
        cartItems: updatedCartItems,
            appliedPromotion: appliedPromotion,
            discountAmount: discountAmount,
            userId: user_id,
            timestamp: Date.now()
          }));
        } else {
          // Clear backup if cart is empty
          localStorage.removeItem(cartBackupKey);
        }
      }

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
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete('/api/session-cart/clear', {
        headers,
        withCredentials: true
      });

      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);

      // Clear localStorage backup (scoped by user_id)
      if (user_id) {
        const cartBackupKey = `cart_backup_${user_id}`;
        localStorage.removeItem(cartBackupKey);
      }

      showSuccess('Cart cleared successfully');

    } catch (error) {
      console.error('Error clearing cart:', error);
      showError('Failed to clear cart');
    }
  };

  // Apply promotion - now uses session-based API
  const applyPromotion = async (promotionCode) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.post('/api/session-cart/promotion', {
        code: promotionCode
      }, {
        headers,
        withCredentials: true
      });

      const { appliedPromotion: newPromotion, discountAmount: newDiscount } = response.data;
      
      // Calculate current subtotal to validate discount
      const currentSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Cap discount at subtotal if it exceeds it
      let finalDiscount = newDiscount || 0;
      let discountCapped = false;
      
      if (finalDiscount > currentSubtotal) {
        finalDiscount = currentSubtotal;
        discountCapped = true;
      }
      
      setAppliedPromotion(newPromotion);
      setDiscountAmount(finalDiscount);

      // Update localStorage backup (scoped by user_id)
      if (user_id && cartItems.length > 0) {
        const cartBackupKey = `cart_backup_${user_id}`;
        localStorage.setItem(cartBackupKey, JSON.stringify({
          cartItems: cartItems,
          appliedPromotion: newPromotion,
          discountAmount: finalDiscount,
          userId: user_id,
          timestamp: Date.now()
        }));
      }

      if (newPromotion) {
        if (discountCapped) {
          // Format subtotal with currency for the warning message
          const formattedSubtotal = formatPriceConverted(currentSubtotal, currency);
          showInfo(`Promotion "${newPromotion.name}" applied, but discount was capped at subtotal amount (${formattedSubtotal}).`);
        } else {
          showSuccess(`Promotion "${newPromotion.name}" applied successfully!`);
        }
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
      throw error;
    }
  };

  // Remove promotion - now uses session-based API
  const removePromotion = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await axios.delete('/api/session-cart/promotion', {
        headers,
        withCredentials: true
      });

      setAppliedPromotion(null);
      setDiscountAmount(0);

      // Update localStorage backup (scoped by user_id)
      if (user_id && cartItems.length > 0) {
        const cartBackupKey = `cart_backup_${user_id}`;
        localStorage.setItem(cartBackupKey, JSON.stringify({
          cartItems: cartItems,
        appliedPromotion: null,
          discountAmount: 0,
          userId: user_id,
          timestamp: Date.now()
        }));
      }
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
  const subtotalAfterDiscount = subtotal - discountAmount; // Subtotal after discount is applied
  const netAmount = subtotalAfterDiscount; // Net amount is the same as subtotal after discount
  const vatAmount = netAmount * (vat_rate / 100);
  const total = netAmount + vatAmount;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
        cartItems,
    appliedPromotion,
    discountAmount,
    subtotal,
    subtotalAfterDiscount,
    netAmount,
    vatAmount,
    vat_rate,
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