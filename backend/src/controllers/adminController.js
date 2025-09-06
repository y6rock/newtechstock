const dbSingleton = require('../../dbSingleton.js');

const db = dbSingleton.getConnection();

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
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

        // Total revenue
        const [revenueResult] = await db.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total_revenue 
            FROM orders 
            ${dateFilter}
        `, params);

        // Total orders
        const [ordersResult] = await db.query(`
            SELECT COUNT(*) as total_orders 
            FROM orders 
            ${dateFilter}
        `, params);

        // Total customers
        const [customersResult] = await db.query(`
            SELECT COUNT(*) as total_customers 
            FROM users 
            WHERE role != 'admin'
        `);

        // Total products
        const [productsResult] = await db.query(`
            SELECT COUNT(*) as total_products 
            FROM products
        `);

        res.json({
            totalRevenue: revenueResult[0].total_revenue,
            totalOrders: ordersResult[0].total_orders,
            totalCustomers: customersResult[0].total_customers,
            totalProducts: productsResult[0].total_products
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get sales over time
exports.getSalesOverTime = async (req, res) => {
    try {
        const { startDate, endDate, period = 'day' } = req.query;
        
        let dateFilter = '';
        let params = [];
        let groupBy = '';
        
        if (startDate && endDate) {
            dateFilter = 'WHERE DATE(order_date) BETWEEN ? AND ?';
            params = [startDate, endDate];
        } else if (startDate) {
            dateFilter = 'WHERE DATE(order_date) >= ?';
            params = [startDate];
        } else if (endDate) {
            dateFilter = 'WHERE DATE(order_date) <= ?';
            params = [endDate];
        }

        switch (period) {
            case 'day':
                groupBy = 'DATE(order_date)';
                break;
            case 'week':
                groupBy = 'YEARWEEK(order_date)';
                break;
            case 'month':
                groupBy = 'DATE_FORMAT(order_date, "%Y-%m")';
                break;
            default:
                groupBy = 'DATE(order_date)';
        }

        const [salesData] = await db.query(`
            SELECT 
                ${groupBy} as period,
                COUNT(*) as orders_count,
                COALESCE(SUM(total_amount), 0) as total_revenue
            FROM orders 
            ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY period ASC
        `, params);

        res.json(salesData);
    } catch (error) {
        console.error('Error fetching sales over time:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get top products
exports.getTopProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const [topProducts] = await db.query(`
            SELECT 
                p.product_id,
                p.name,
                p.price,
                COALESCE(SUM(oi.quantity), 0) as total_sold,
                COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
            FROM products p
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.order_id
            GROUP BY p.product_id, p.name, p.price
            ORDER BY total_sold DESC
            LIMIT ?
        `, [parseInt(limit)]);

        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all orders with optional user filter
exports.getOrders = async (req, res) => {
    try {
        const { userId } = req.query;
        
        let sql = `
            SELECT 
                o.order_id,
                o.user_id,
                u.name as customer_name,
                u.email as customer_email,
                o.total_amount,
                o.status,
                o.order_date,
                o.shipping_address
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
        `;
        
        let params = [];
        
        if (userId) {
            sql += ' WHERE o.user_id = ?';
            params.push(userId);
        }
        
        sql += ' ORDER BY o.order_date DESC';
        
        const [orders] = await db.query(sql, params);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get order status distribution
exports.getOrderStatusDistribution = async (req, res) => {
    try {
        const [statusData] = await db.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM orders
            GROUP BY status
            ORDER BY count DESC
        `);

        res.json(statusData);
    } catch (error) {
        console.error('Error fetching order status distribution:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all customers (non-admin users) with their order stats
exports.getCustomers = async (req, res) => {
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
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete customer (user)
exports.deleteCustomer = async (req, res) => {
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
    } catch (error) {
        console.error("Error deactivating customer:", error);
        res.status(500).json({ message: "Database error" });
    }
};

// Restore a deactivated customer (set isActive to true)
exports.restoreCustomer = async (req, res) => {
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
    } catch (error) {
        console.error("Error restoring customer:", error);
        res.status(500).json({ message: "Database error" });
    }
};

// Get low stock products (stock <= 10)
exports.getLowStockProducts = async (req, res) => {
    try {
        const [lowStockProducts] = await db.query(`
            SELECT 
                product_id,
                name,
                price,
                stock_quantity
            FROM products
            WHERE stock_quantity <= 10
            ORDER BY stock_quantity ASC
        `);
        
        res.json(lowStockProducts);
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
