const express = require('express');
const { authenticateToken } = require('../middleware/auth.js');
const {
    validateCart,
    getCartProductInfo
} = require('../controllers/cartController.js');

const router = express.Router();

// Validate and synchronize cart items with current product data
router.post('/validate', authenticateToken, validateCart);

// Get current product information for cart items
router.post('/product-info', authenticateToken, getCartProductInfo);

module.exports = router;
