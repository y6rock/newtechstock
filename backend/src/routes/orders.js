const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    createOrder,
    getOrderHistory,
    updateOrderStatus,
    getOrderDetails,
    updateOrderStatusAfterPayment
} = require('../controllers/orderController.js');

const router = express.Router();

// Create a new order (checkout)
router.post('/', authenticateToken, createOrder);

// Get order history for a user
router.get('/history/:userId', authenticateToken, getOrderHistory);

// Update order status (admin only)
router.put('/:orderId/status', authenticateToken, requireAdmin, updateOrderStatus);

// Update order status after payment (for PayPal callbacks)
router.put('/:orderId/payment-status', authenticateToken, updateOrderStatusAfterPayment);

// Get single order details (user can view their own orders, admin can view all)
router.get('/:orderId', authenticateToken, getOrderDetails);

module.exports = router; 