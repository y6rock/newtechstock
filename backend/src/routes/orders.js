const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const InvoiceGenerator = require('../../utils/invoiceGenerator.js');
const EmailService = require('../../utils/emailService.js');

const router = express.Router();
const db = dbSingleton.getConnection();
const emailService = new EmailService();

// Create a new order (checkout)
router.post('/', authenticateToken, async (req, res) => {
    const { user_id, items, total_amount, shipping_address, payment_method, promotion_id, paypal_payment_id } = req.body;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Validate inventory before processing order
        for (const item of items) {
            const [productResult] = await connection.query(
                'SELECT stock, name FROM products WHERE product_id = ?',
                [item.product_id]
            );
            
            if (productResult.length === 0) {
                await connection.rollback();
                return res.status(400).json({ message: `Product with ID ${item.product_id} not found` });
            }
            
            const product = productResult[0];
            if (product.stock < item.quantity) {
                await connection.rollback();
                return res.status(400).json({ 
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
                });
            }
        }

        const orderSql = `
            INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, promotion_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [orderResult] = await connection.query(orderSql, [user_id, total_amount, shipping_address, payment_method, promotion_id]);
        
        // If PayPal payment, you might want to store the payment ID in a separate table
        if (payment_method === 'paypal' && paypal_payment_id) {
            console.log('PayPal payment processed:', paypal_payment_id);
        }
        const orderId = orderResult.insertId;

        const orderItemsSql = `
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES ?
        `;
        const orderItemsValues = items.map(item => [orderId, item.product_id, item.quantity, item.price]);
        await connection.query(orderItemsSql, [orderItemsValues]);

        // You might also want to decrease product stock here
        for (const item of items) {
            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        // Get user information for invoice
        const [userResult] = await connection.query('SELECT name, email FROM users WHERE user_id = ?', [user_id]);
        const user = userResult[0];

        // Get order items with product names for invoice
        const [itemsResult] = await connection.query(`
            SELECT oi.product_id, oi.quantity, oi.price, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `, [orderId]);

        // Get promotion details if applied
        let promotionDetails = null;
        if (promotion_id) {
            const [promotionResult] = await connection.query(
                'SELECT name, type, value FROM promotions WHERE promotion_id = ?',
                [promotion_id]
            );
            if (promotionResult.length > 0) {
                promotionDetails = promotionResult[0];
            }
        }

        // Calculate discount amount (if promotion was applied)
        let discountAmount = 0;
        if (promotionDetails) {
            const subtotal = itemsResult.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (promotionDetails.type === 'percentage') {
                discountAmount = subtotal * (promotionDetails.value / 100);
            } else if (promotionDetails.type === 'fixed') {
                discountAmount = parseFloat(promotionDetails.value);
            }
        }

        // Prepare order data for invoice
        const orderData = {
            order_id: orderId,
            order_date: new Date(),
            total_amount: total_amount,
            shipping_address: shipping_address,
            payment_method: payment_method,
            items: itemsResult,
            promotion: promotionDetails,
            discount_amount: discountAmount
        };

        const userData = {
            name: user.name,
            email: user.email
        };

        try {
            // Generate PDF invoice
            const invoiceGenerator = new InvoiceGenerator();
            const invoicePath = await invoiceGenerator.generateInvoice(orderData, userData);

            // Send only invoice email (removed confirmation email to avoid duplicates)
            await emailService.sendInvoiceEmail(user.email, user.name, orderId, invoicePath);

            console.log(`Invoice email sent for order ${orderId}`);
        } catch (emailError) {
            console.error('Error sending invoice email:', emailError);
            // Don't fail the order if email fails
        }

        res.status(201).json({ message: 'Order created successfully', orderId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Database error', details: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Get order history for a user
router.get('/history/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    if (req.user.user_id.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
        const sql = `
            SELECT o.order_id, o.order_date, o.total_amount, o.status,
                   oi.product_id, oi.quantity, oi.price, p.name as product_name, p.image as product_image
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.user_id = ?
            ORDER BY o.order_date DESC
        `;
        const [rows] = await db.query(sql, [userId]);
        
        // Group items by order
        const orders = {};
        rows.forEach(row => {
            if (!orders[row.order_id]) {
                orders[row.order_id] = {
                    order_id: row.order_id,
                    order_date: row.order_date,
                    total_amount: row.total_amount,
                    status: row.status,
                    items: []
                };
            }
            orders[row.order_id].items.push({
                product_id: row.product_id,
                product_name: row.product_name,
                product_image: row.product_image,
                quantity: row.quantity,
                price: row.price
            });
        });

        res.json(Object.values(orders));
    } catch (err) {
        console.error('Error fetching order history:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update order status (admin only)
router.put('/:orderId/status', authenticateToken, requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }

    // Optional: Validate that the status is one of the allowed values
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }

    try {
        const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
        const [result] = await db.query(sql, [status, orderId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json({ message: 'Order status updated successfully' });
    } catch (err) {
        console.error(`Error updating status for order ${orderId}:`, err);
        res.status(500).json({ message: 'Database error', details: err.message });
    }
});

// Get single order details (admin only)
router.get('/:orderId', authenticateToken, requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    try {
        const sql = `
            SELECT
                o.order_id,
                o.order_date,
                o.total_amount AS total_price,
                o.status,
                o.shipping_address,
                o.payment_method,
                u.name AS user_name,
                u.email AS user_email,
                oi.quantity,
                oi.price AS price_at_order,
                p.name AS product_name
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.order_id = ?
        `;
        const [rows] = await db.query(sql, [orderId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Group items into a single order object
        const orderDetails = {
            order_id: rows[0].order_id,
            order_date: rows[0].order_date,
            total_price: rows[0].total_price,
            status: rows[0].status,
            shipping_address: rows[0].shipping_address,
            payment_method: rows[0].payment_method,
            user_name: rows[0].user_name,
            user_email: rows[0].user_email,
            products: rows.map(row => ({
                product_name: row.product_name,
                quantity: row.quantity,
                price_at_order: row.price_at_order,
            })),
        };

        res.json(orderDetails);
    } catch (err) {
        console.error(`Error fetching details for order ${orderId}:`, err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router; 