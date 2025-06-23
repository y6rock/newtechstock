import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext'; // Import useSettings
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user_id } = useSettings();
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
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product_id === product.product_id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + quantity } : item
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
    if (isNaN(quantity) || quantity < 1) return;
    setCartItems((prevItems) => {
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
  const total = subtotal - discountAmount;
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
        total,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext); 