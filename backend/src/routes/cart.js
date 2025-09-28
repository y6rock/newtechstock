const express = require('express');
const { authenticateToken } = require('../middleware/auth.js');
const {
    validateCart,
    getCartProductInfo,
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyPromotion,
    removePromotion
} = require('../controllers/cartController.js');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, getCart);

// Add item to cart
router.post('/add', authenticateToken, addToCart);

// Update cart item quantity
router.put('/update', authenticateToken, updateCartItem);

// Remove item from cart
router.delete('/remove', authenticateToken, removeFromCart);

// Clear entire cart
router.delete('/clear', authenticateToken, clearCart);

// Apply promotion to cart
router.post('/promotion/apply', authenticateToken, applyPromotion);

// Remove promotion from cart
router.delete('/promotion/remove', authenticateToken, removePromotion);

// Validate and synchronize cart items with current product data
router.post('/validate', authenticateToken, validateCart);

// Get current product information for cart items
router.post('/product-info', authenticateToken, getCartProductInfo);

module.exports = router;
