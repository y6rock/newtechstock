const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get dashboard stats
router.get('/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        console.log('Dashboard stats request:', { startDate, endDate });
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE DATE(order_date) BETWEEN ? AND ?';
            params = [startDate, endDate];
        } else if (startDate) {
            dateFilter = 'WHERE DATE(order_date) >= ?';
            params = [startDate];
        } else if (endDate) {
            dateFilter = 'WHERE DATE(order_date) <= ?';
            params = [endDate];
        } else {
            // No date filter - show all data
            dateFilter = '';
        }
        
        // Get all orders first to debug
        const [allOrders] = await db.query("SELECT COUNT(*) as total FROM orders");
        console.log('Total orders in database:', allOrders[0].total);
        
        const [revenue] = await db.query(
            `SELECT SUM(total_amount) as total_revenue FROM orders ${dateFilter}`,
            params
        );
        const [orders] = await db.query(
            `SELECT COUNT(*) as total_orders FROM orders ${dateFilter}`,
            params
        );
        const [products] = await db.query("SELECT COUNT(*) as total_products FROM products WHERE is_active = 1");
        const [allProducts] = await db.query("SELECT COUNT(*) as total_all_products FROM products");
        
        console.log('Dashboard stats results:', {
            revenue: revenue[0].total_revenue,
            orders: orders[0].total_orders,
            products: products[0].total_products,
            allProducts: allProducts[0].total_all_products
        });
        
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
        const { startDate, endDate } = req.query;
        
        console.log('Sales over time request:', { startDate, endDate });
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE DATE(order_date) BETWEEN ? AND ?';
            params = [startDate, endDate];
        } else if (startDate) {
            dateFilter = 'WHERE DATE(order_date) >= ?';
            params = [startDate];
        } else if (endDate) {
            dateFilter = 'WHERE DATE(order_date) <= ?';
            params = [endDate];
        } else {
            // No date filter - show all data
            dateFilter = '';
        }
        
        const [sales] = await db.query(`
            SELECT
                DATE(order_date) as day,
                SUM(total_amount) as total_sales,
                COUNT(order_id) as order_count
            FROM orders
            ${dateFilter}
            GROUP BY day
            ORDER BY day
        `, params);
        
        console.log('Sales over time results:', sales);
        res.json(sales);
    } catch (err) {
        console.error("Error fetching sales data:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get top selling products
router.get('/top-products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'JOIN orders o ON oi.order_id = o.order_id WHERE DATE(o.order_date) BETWEEN ? AND ?';
            params = [startDate, endDate];
        } else {
            // Default to last 30 days if no dates provided
            dateFilter = 'JOIN orders o ON oi.order_id = o.order_id WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        }
        
        const [products] = await db.query(`
            SELECT p.name, SUM(oi.quantity) as total_quantity, SUM(oi.price * oi.quantity) as total_sales
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            ${dateFilter}
            GROUP BY p.product_id, p.name
            ORDER BY total_sales DESC
            LIMIT 5
        `, params);
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
                o.user_id,
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
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE DATE(order_date) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }
        // Remove the default 30-day filter to show all orders
        
        const [statuses] = await db.query(`
            SELECT status, COUNT(order_id) as count
            FROM orders
            ${dateFilter}
            GROUP BY status
        `, params);
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
                COALESCE(SUM(o.total_amount), 0) AS total_spent,
                CASE WHEN u.isActive = TRUE THEN "Active" ELSE "Inactive" END as status
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

// Delete customer (user)
router.delete('/customers/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists and is not an admin
        const [userCheck] = await db.query(`
            SELECT user_id, role FROM users WHERE user_id = ?
        `, [userId]);
        
        if (userCheck.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (userCheck[0].role === 'admin') {
            return res.status(403).json({ message: "Cannot delete admin users" });
        }
        
        // Check if user has any orders
        const [ordersCheck] = await db.query(`
            SELECT COUNT(*) as order_count FROM orders WHERE user_id = ?
        `, [userId]);
        
        if (ordersCheck[0].order_count > 0) {
            return res.status(400).json({ 
                message: "Cannot delete customer with existing orders. Please handle their orders first." 
            });
        }
        
        // Soft delete the user (set isActive to false)
        const [result] = await db.query(`
            UPDATE users SET isActive = FALSE WHERE user_id = ?
        `, [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json({ message: "Customer deactivated successfully" });
    } catch (err) {
        console.error("Error deactivating customer:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Restore a deactivated customer (set isActive to true)
router.patch('/customers/:userId/restore', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists
        const [userCheck] = await db.query(`
            SELECT user_id, role FROM users WHERE user_id = ?
        `, [userId]);
        
        if (userCheck.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (userCheck[0].role === 'admin') {
            return res.status(403).json({ message: "Cannot restore admin users" });
        }
        
        // Restore the user
        const [result] = await db.query(`
            UPDATE users SET isActive = TRUE WHERE user_id = ?
        `, [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json({ message: "Customer restored successfully" });
    } catch (err) {
        console.error("Error restoring customer:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get low stock products (stock <= 10)
router.get('/low-stock-products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // First, let's check what products we have with low stock
        const [allProducts] = await db.query(`
            SELECT 
                p.product_id,
                p.name,
                p.stock,
                p.is_active
            FROM products p
            WHERE CAST(p.stock AS UNSIGNED) <= 10
            ORDER BY CAST(p.stock AS UNSIGNED) ASC
        `);
        
        console.log('All products with stock <= 10:', allProducts);
        
        // Now get the full details for ALL products with low stock (including inactive)
        const [products] = await db.query(`
            SELECT 
                p.product_id as id,
                p.name,
                p.description,
                p.price,
                p.stock,
                p.image,
                p.is_active,
                c.name as category
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE CAST(p.stock AS UNSIGNED) <= 10
            ORDER BY CAST(p.stock AS UNSIGNED) ASC, p.name ASC
        `);

        console.log('Active products with low stock:', products);
        res.json(products);
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router; 