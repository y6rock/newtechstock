import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext'; // Import useSettings

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user_id, username } = useSettings(); // Get user_id from SettingsContext
  console.log('CartContext: current user_id from SettingsContext (at render):', user_id);

  const isInitialMount = useRef(true);

  const [cartItems, setCartItems] = useState([]); // Initialize as empty array, will be populated by useEffect

  // Effect to load cart when user_id changes (login/logout/switch)
  useEffect(() => {
    console.log('CartContext: useEffect for user_id change triggered. Current user_id:', user_id);
    if (user_id) {
      // If user logs in or switches, load their specific cart
      try {
        const storedCart = localStorage.getItem(`cartItems_${user_id}`);
        console.log(`CartContext: Attempting to load cart for user ${user_id}. Raw stored data:`, storedCart);
        setCartItems(storedCart ? JSON.parse(storedCart) : []);
        console.log(`CartContext: Loaded cart for user ${user_id}.`, storedCart ? JSON.parse(storedCart) : []);
      } catch (error) {
        console.error("CartContext: Failed to load cart for user", user_id, ":", error);
        setCartItems([]);
      }
    } else {
      // If no user is logged in (user_id is null), clear the current cart state
      setCartItems([]);
      console.log('CartContext: User logged out or no user_id, cleared cart state.');
    }
  }, [user_id]); // Trigger when user_id changes (login/logout/switch)

  // Effect to save cart to localStorage whenever cartItems or user_id changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Skip initial render's localStorage write
    }
    console.log('CartContext: useEffect for saving cart triggered. user_id:', user_id, 'cartItems:', cartItems);
    if (user_id) {
      localStorage.setItem(`cartItems_${user_id}`, JSON.stringify(cartItems));
      console.log(`CartContext: Saved cart for user ${user_id}.`);
    } else {
      // If no user, clear the generic cart and potentially old user-specific carts
      localStorage.removeItem('cartItems'); // Clean up old non-user-specific cart
      console.log('CartContext: No user_id, cleared generic cart.');
    }
  }, [cartItems, user_id]); // Re-run when cartItems or user_id changes

  const addToCart = (product, quantity = 1) => {
    console.log('CartContext: addToCart called. Checking user_id:', user_id);
    if (!user_id) {
      alert('Please log in to add items to your cart.');
      return;
    }
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.product_id === product.product_id);

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
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
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext); 