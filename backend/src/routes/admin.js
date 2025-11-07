const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    getDashboardStats,
    getSalesOverTime,
    getTopProducts,
    getOrders,
    getOrderStatusDistribution,
    getCustomers,
    getCustomerStats,
    deleteCustomer,
    restoreCustomer,
    getLowStockProducts
} = require('../controllers/adminController.js');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard-stats', authenticateToken, requireAdmin, getDashboardStats);

// Get sales over time
router.get('/sales-over-time', authenticateToken, requireAdmin, getSalesOverTime);

// Get top products
router.get('/top-products', authenticateToken, requireAdmin, getTopProducts);

// Get all orders with optional user filter
router.get('/orders', authenticateToken, requireAdmin, getOrders);

// Get order status distribution
router.get('/order-status-distribution', authenticateToken, requireAdmin, getOrderStatusDistribution);

// Get all customers (non-admin users) with their order stats
router.get('/customers', authenticateToken, requireAdmin, getCustomers);

// Get customer statistics (total, active, inactive)
router.get('/customer-stats', authenticateToken, requireAdmin, getCustomerStats);

// Delete customer (user)
router.delete('/customers/:userId', authenticateToken, requireAdmin, deleteCustomer);

// Restore a deactivated customer (set isActive to true)
router.patch('/customers/:userId/restore', authenticateToken, requireAdmin, restoreCustomer);

// Get low stock products (stock <= 10)
router.get('/low-stock-products', authenticateToken, requireAdmin, getLowStockProducts);

module.exports = router;