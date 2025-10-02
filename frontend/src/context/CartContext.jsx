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

  // Load cart from sessionStorage when user_id changes
  useEffect(() => {
    if (user_id && !isInitialMount.current) {
      loadCartFromSession();
    }
    isInitialMount.current = false;
  }, [user_id]);

  // Load cart from sessionStorage
  const loadCartFromSession = () => {
    if (!user_id) return;

    setIsLoading(true);
    try {
      const cartData = sessionStorage.getItem(`cart_${user_id}`);
      if (cartData) {
        const { cartItems: sessionCartItems, appliedPromotion: sessionPromotion, discountAmount: sessionDiscount } = JSON.parse(cartData);

        setCartItems(sessionCartItems || []);
        setAppliedPromotion(sessionPromotion);
        setDiscountAmount(sessionDiscount || 0);
      } else {
        // Initialize empty cart for new user
        setCartItems([]);
        setAppliedPromotion(null);
        setDiscountAmount(0);
      }
    } catch (error) {
      console.error('Error loading cart from session:', error);
      // Reset to empty cart on error
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
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

    try {
      // Update cart in memory
      const existingItemIndex = cartItems.findIndex(item => item.product_id === product.product_id);

      let updatedCartItems;
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedCartItems = [...cartItems];
        updatedCartItems[existingItemIndex] = {
          ...updatedCartItems[existingItemIndex],
          quantity: updatedCartItems[existingItemIndex].quantity + quantity,
          price: product.price // Update price in case it changed
        };
      } else {
        // Add new item
        updatedCartItems = [...cartItems, {
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: quantity,
          category_name: product.category_name,
          supplier_name: product.supplier_name
        }];
      }

      setCartItems(updatedCartItems);

      // Save to sessionStorage
      const cartData = {
        cartItems: updatedCartItems,
        appliedPromotion,
        discountAmount
      };
      sessionStorage.setItem(`cart_${user_id}`, JSON.stringify(cartData));

      showSuccess(`Added ${quantity} ${product.name} to cart!`);

    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Failed to add item to cart');
    }
  };

  // Remove from cart - now uses sessionStorage only
  const removeFromCart = async (productId) => {
    if (!user_id) return;

    try {
      // Update cart in memory
      const updatedCartItems = cartItems.filter(item => item.product_id !== productId);
      setCartItems(updatedCartItems);

      // Save to sessionStorage
      const cartData = {
        cartItems: updatedCartItems,
        appliedPromotion,
        discountAmount
      };
      sessionStorage.setItem(`cart_${user_id}`, JSON.stringify(cartData));

      showSuccess('Item removed from cart');

    } catch (error) {
      console.error('Error removing from cart:', error);
      showError('Failed to remove item from cart');
    }
  };

  // Update quantity - now uses sessionStorage only
  const updateQuantity = async (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) {
      showError('Please enter a valid quantity (minimum 1).');
      return;
    }

    if (!user_id) return;

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
      // Update cart in memory
      const updatedCartItems = cartItems.map(item =>
        item.product_id === productId ? { ...item, quantity: quantity } : item
      );
      setCartItems(updatedCartItems);

      // Save to sessionStorage
      const cartData = {
        cartItems: updatedCartItems,
        appliedPromotion,
        discountAmount
      };
      sessionStorage.setItem(`cart_${user_id}`, JSON.stringify(cartData));

      showSuccess('Quantity updated');

    } catch (error) {
      console.error('Error updating cart:', error);
      showError('Failed to update cart item');
    }
  };

  // Clear cart - now uses sessionStorage only
  const clearCart = async () => {
    if (!user_id) {
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
      return;
    }

    try {
      // Clear cart in memory
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);

      // Clear from sessionStorage
      sessionStorage.removeItem(`cart_${user_id}`);

      showSuccess('Cart cleared');

    } catch (error) {
      console.error('Error clearing cart:', error);
      showError('Failed to clear cart');
    }
  };

  // Apply promotion - now uses sessionStorage only
  const applyPromotion = async (promotion, calculatedDiscount) => {
    if (!user_id) {
      showError('Please log in to apply promotions.');
      return false;
    }

    try {
      // Update cart in memory
      setAppliedPromotion(promotion);
      setDiscountAmount(calculatedDiscount);

      // Save to sessionStorage
      const cartData = {
        cartItems,
        appliedPromotion: promotion,
        discountAmount: calculatedDiscount
      };
      sessionStorage.setItem(`cart_${user_id}`, JSON.stringify(cartData));

      showSuccess(`Applied promotion: ${promotion.name}`);
      return true;

    } catch (error) {
      console.error('Error applying promotion:', error);
      showError('Failed to apply promotion');
      return false;
    }
  };

  // Remove promotion - now uses sessionStorage only
  const removePromotion = async () => {
    if (!user_id) {
      setAppliedPromotion(null);
      setDiscountAmount(0);
      return;
    }

    try {
      // Update cart in memory
      setAppliedPromotion(null);
      setDiscountAmount(0);

      // Save to sessionStorage
      const cartData = {
        cartItems,
        appliedPromotion: null,
        discountAmount: 0
      };
      sessionStorage.setItem(`cart_${user_id}`, JSON.stringify(cartData));

      showSuccess('Promotion removed');

    } catch (error) {
      console.error('Error removing promotion:', error);
      showError('Failed to remove promotion');
    }
  };

  // Clear cart from sessionStorage (for logout)
  const clearCartSession = () => {
    if (user_id) {
      sessionStorage.removeItem(`cart_${user_id}`);
    }
    setCartItems([]);
    setAppliedPromotion(null);
    setDiscountAmount(0);
  };

  // Clear cart when user logs out (when user_id becomes null)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!user_id) {
      // User logged out, clear cart
      clearCartSession();
    }
  }, [user_id]);

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
        clearCartSession,
        appliedPromotion,
        discountAmount,
        applyPromotion,
        removePromotion,
        validateCart,
        isValidating,
        isLoading,
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
