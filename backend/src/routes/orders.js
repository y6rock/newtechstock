const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    createOrder,
    getOrderHistory,
    updateOrderStatus,
    getOrderDetails
} = require('../controllers/orderController.js');

const router = express.Router();

// Create a new order (checkout)
router.post('/', authenticateToken, createOrder);

// Get order history for a user
router.get('/history/:userId', authenticateToken, getOrderHistory);

// Update order status (admin only)
router.put('/:orderId/status', authenticateToken, requireAdmin, updateOrderStatus);

// Get single order details (admin only)
router.get('/:orderId', authenticateToken, requireAdmin, getOrderDetails);

module.exports = router; 