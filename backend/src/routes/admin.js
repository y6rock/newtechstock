const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get dashboard stats
router.get('/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [revenue] = await db.query("SELECT SUM(total_amount) as total_revenue FROM orders");
        const [orders] = await db.query("SELECT COUNT(*) as total_orders FROM orders");
        const [products] = await db.query("SELECT COUNT(*) as total_products FROM products");
        res.json({
            total_revenue: revenue[0].total_revenue || 0,
            total_orders: orders[0].total_orders || 0,
            total_products: products[0].total_products || 0,
        });
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get sales over time data
router.get('/sales-over-time', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [sales] = await db.query(`
            SELECT
                DATE(order_date) as day,
                SUM(total_amount) as total_sales,
                COUNT(order_id) as order_count
            FROM orders
            GROUP BY day
            ORDER BY day
        `);
        res.json(sales);
    } catch (err) {
        console.error("Error fetching sales data:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get top selling products
router.get('/top-products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.name, SUM(oi.quantity) as total_quantity, SUM(oi.price * oi.quantity) as total_sales
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.name
            ORDER BY total_sales DESC
            LIMIT 5
        `);
        res.json(products);
    } catch (err) {
        console.error("Error fetching top products:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get ALL orders for the admin panel
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT 
                o.order_id, 
                o.order_date, 
                o.total_amount AS total_price, 
                o.status,
                u.name AS user_name,
                u.email AS user_email
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.order_date DESC
        `);
        res.json(orders);
    } catch (err) {
        console.error("Error fetching all orders:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get order status distribution
router.get('/order-status-distribution', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [statuses] = await db.query(`
            SELECT status, COUNT(order_id) as count
            FROM orders
            GROUP BY status
        `);
        res.json(statuses);
    } catch (err) {
        console.error("Error fetching order status distribution:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get all customers (non-admin users) with their order stats
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT 
                u.user_id,
                u.name AS username,
                u.email,
                u.phone,
                COUNT(o.order_id) AS order_count,
                SUM(o.total_amount) AS total_spent
            FROM users u
            LEFT JOIN orders o ON u.user_id = o.user_id
            WHERE u.role != 'admin'
            GROUP BY u.user_id, u.name, u.email, u.phone
            ORDER BY u.name
        `);
        res.json(customers);
    } catch (err) {
        console.error("Error fetching customers:", err);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router; 