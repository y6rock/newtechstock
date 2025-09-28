import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext'; // Import useSettings
import { useToast } from './ToastContext'; // Import useToast for notifications
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user_id, vat_rate } = useSettings();
  const { showSuccess, showError, showInfo } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const isInitialMount = useRef(true);
  const lastValidationTime = useRef(0);

  // Load cart and promotion from localStorage when user_id changes
  useEffect(() => {
    if (user_id) {
      try {
        const storedCart = localStorage.getItem(`cartItems_${user_id}`);
        const storedPromotion = localStorage.getItem(`promotion_${user_id}`);
        
        setCartItems(storedCart ? JSON.parse(storedCart) : []);
        if (storedPromotion) {
            const { promotion, discount } = JSON.parse(storedPromotion);
            setAppliedPromotion(promotion);
            setDiscountAmount(discount);
        } else {
            setAppliedPromotion(null);
            setDiscountAmount(0);
        }
      } catch (error) {
        console.error("CartContext: Failed to load cart/promotion for user", user_id, ":", error);
        setCartItems([]);
        setAppliedPromotion(null);
        setDiscountAmount(0);
      }
    } else {
      setCartItems([]);
      setAppliedPromotion(null);
      setDiscountAmount(0);
    }
  }, [user_id]);

  // Save cart and promotion to localStorage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (user_id) {
      localStorage.setItem(`cartItems_${user_id}`, JSON.stringify(cartItems));
      if (appliedPromotion) {
        localStorage.setItem(`promotion_${user_id}`, JSON.stringify({ promotion: appliedPromotion, discount: discountAmount }));
      } else {
        localStorage.removeItem(`promotion_${user_id}`);
      }
    }
  }, [cartItems, appliedPromotion, discountAmount, user_id]);

  // Cart validation and synchronization function
  const validateCart = async (showNotifications = true) => {
    if (!user_id || cartItems.length === 0 || isValidating) {
      return;
    }

    // Check if user has a valid token before attempting validation
    const token = localStorage.getItem('token');
    if (!token) {
      return; // Don't validate if no token
    }

    // Throttle validation to prevent excessive API calls (max once per 30 seconds)
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

      // Update cart with validated items
      if (validatedCart.length !== cartItems.length || changes.length > 0) {
        setCartItems(validatedCart);
      }

      // Show notifications for changes
      if (showNotifications) {
        // Notify about removed items
        if (removedItems.length > 0) {
          const removedNames = removedItems.map(item => item.name).join(', ');
          showError(`${removedItems.length} item(s) removed from cart: ${removedNames}`);
        }

        // Notify about price changes
        const priceChanges = changes.filter(change => 
          change.changes.some(c => c.field === 'price')
        );
        if (priceChanges.length > 0) {
          showInfo(`Prices updated for ${priceChanges.length} item(s) in your cart`);
        }

        // Notify about quantity reductions
        const quantityChanges = changes.filter(change => 
          change.changes.some(c => c.field === 'quantity')
        );
        if (quantityChanges.length > 0) {
          showInfo(`Quantities adjusted for ${quantityChanges.length} item(s) due to stock limits`);
        }

        // General update notification
        if (changes.length > 0 && !priceChanges.length && !quantityChanges.length) {
          showInfo(`${changes.length} item(s) in your cart have been updated`);
        }
      }

      console.log('Cart validation completed:', summary);

    } catch (error) {
      console.error('Cart validation failed:', error);
      
      // Handle different types of errors appropriately
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Authentication error - don't show error toast, just log it
        console.log('Cart validation skipped: Authentication required');
        if (showNotifications && user_id) {
          // Only show auth message if user thinks they're logged in
          showInfo('Session expired. Please log in again to validate cart items');
        }
      } else if (showNotifications) {
        // Network or server error - show error message
        const errorMessage = error.response?.data?.message || 'Unable to connect to server. Please try again.';
        showError(errorMessage);
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Validate cart on initial load and when user_id changes
  useEffect(() => {
    if (user_id && cartItems.length > 0 && !isInitialMount.current) {
      // Delay validation slightly to allow cart to load
      const timer = setTimeout(() => {
        validateCart(false); // Don't show notifications on initial load
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user_id]);

  // Validate cart when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user_id && cartItems.length > 0 && localStorage.getItem('token')) {
        // Only validate if user has been away for more than 30 seconds
        const now = Date.now();
        if (now - lastValidationTime.current > 30000) {
          validateCart(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user_id, cartItems.length]);

  const addToCart = (product, quantity = 1) => {
    if (!user_id) {
      showError('Please log in to add items to your cart.');
      return;
    }
    
    // Enhanced inventory validation
    if (!product.stock || product.stock < 0) {
      showError('This product has invalid inventory data and cannot be added to cart.');
      return;
    }
    
    // Check if product is out of stock
    if (product.stock === 0) {
      showError('This product is out of stock and cannot be added to cart.');
      return;
    }
    
    // Validate quantity parameter
    if (!quantity || quantity <= 0) {
      showError('Please select a valid quantity.');
      return;
    }
    
    // Check if requested quantity exceeds available stock
    if (quantity > product.stock) {
      showError(`Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available. Cannot add ${quantity} to cart.`);
      return;
    }
    
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product_id === product.product_id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          showError(`Cannot add more than ${product.stock} unit${product.stock === 1 ? '' : 's'} of this product to cart. You already have ${existingItem.quantity} in your cart.`);
          return prevItems;
        }
        return prevItems.map((item) =>
          item.product_id === product.product_id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
  };
  
  const updateQuantity = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) {
      showError('Please enter a valid quantity (minimum 1).');
      return;
    }
    
    setCartItems((prevItems) => {
      const item = prevItems.find(item => item.product_id === productId);
      if (!item) return prevItems;
      
      // Enhanced inventory validation
      if (!item.stock || item.stock < 0) {
        showError('This product has invalid inventory data.');
        return prevItems;
      }
      
      // Check if new quantity exceeds stock
      if (quantity > item.stock) {
        showError(`Only ${item.stock} unit${item.stock === 1 ? '' : 's'} available. Cannot set quantity to ${quantity}.`);
        return prevItems;
      }
      
      return prevItems.map((item) =>
        item.product_id === productId ? { ...item, quantity: quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromotion(null);
    setDiscountAmount(0);
  };
  
  const applyPromotion = async (promotionCode) => {
    const cartData = cartItems.map(item => ({
      product_id: item.product_id,
      price: parseFloat(item.price),
      quantity: item.quantity,
      category_id: item.category_id,
    }));
    
    console.log('Frontend: Applying promotion code:', promotionCode.trim());
    console.log('Frontend: Cart items being sent:', cartData);
    
    const response = await axios.post('/api/promotions/apply', {
        promotionCode: promotionCode.trim(),
        cartItems: cartData,
    });
    
    console.log('Frontend: Promotion response:', response.data);
    setAppliedPromotion(response.data.promotion);
    setDiscountAmount(response.data.totalDiscount);
  };

  const removePromotion = () => {
    setAppliedPromotion(null);
    setDiscountAmount(0);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const vatAmount = (subtotalAfterDiscount * (vat_rate || 0)) / 100;
  const netAmount = subtotalAfterDiscount - vatAmount;
  const total = subtotalAfterDiscount; // Total stays the same, VAT is just a breakdown
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