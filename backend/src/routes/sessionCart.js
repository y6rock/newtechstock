const express = require('express');
const { authenticateToken } = require('../middleware/auth.js');
const {
    getSessionCart,
    addToSessionCart,
    updateSessionCartItem,
    removeFromSessionCart,
    clearSessionCart,
    validateSessionCart
} = require('../controllers/sessionCartController.js');

const router = express.Router();

// Get session cart (works for both authenticated and anonymous users)
router.get('/', getSessionCart);

// Add item to session cart (works for both authenticated and anonymous users)
router.post('/add', addToSessionCart);

// Update item quantity in session cart
router.put('/update', updateSessionCartItem);

// Remove item from session cart
router.delete('/remove', removeFromSessionCart);

// Clear session cart
router.delete('/clear', clearSessionCart);

// Validate and synchronize cart items with current product data
router.post('/validate', validateSessionCart);

module.exports = router;

