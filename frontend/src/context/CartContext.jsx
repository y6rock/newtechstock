import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext'; // Import useSettings
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user_id, vat_rate } = useSettings();
  const [cartItems, setCartItems] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const isInitialMount = useRef(true);

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

  const addToCart = (product, quantity = 1) => {
    if (!user_id) {
      alert('Please log in to add items to your cart.');
      return;
    }
    
    // Enhanced inventory validation
    if (!product.stock || product.stock < 0) {
      alert('This product has invalid inventory data and cannot be added to cart.');
      return;
    }
    
    // Check if product is out of stock
    if (product.stock === 0) {
      alert('This product is out of stock and cannot be added to cart.');
      return;
    }
    
    // Validate quantity parameter
    if (!quantity || quantity <= 0) {
      alert('Please select a valid quantity.');
      return;
    }
    
    // Check if requested quantity exceeds available stock
    if (quantity > product.stock) {
      alert(`Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available. Cannot add ${quantity} to cart.`);
      return;
    }
    
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product_id === product.product_id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          alert(`Cannot add more than ${product.stock} unit${product.stock === 1 ? '' : 's'} of this product to cart. You already have ${existingItem.quantity} in your cart.`);
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
      alert('Please enter a valid quantity (minimum 1).');
      return;
    }
    
    setCartItems((prevItems) => {
      const item = prevItems.find(item => item.product_id === productId);
      if (!item) return prevItems;
      
      // Enhanced inventory validation
      if (!item.stock || item.stock < 0) {
        alert('This product has invalid inventory data.');
        return prevItems;
      }
      
      // Check if new quantity exceeds stock
      if (quantity > item.stock) {
        alert(`Only ${item.stock} unit${item.stock === 1 ? '' : 's'} available. Cannot set quantity to ${quantity}.`);
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
    const response = await axios.post('/api/promotions/apply', {
        promotionCode: promotionCode.trim(),
        cartItems: cartItems.map(item => ({
          product_id: item.product_id,
          price: parseFloat(item.price),
          quantity: item.quantity,
          category_id: item.category_id,
        })),
    });
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