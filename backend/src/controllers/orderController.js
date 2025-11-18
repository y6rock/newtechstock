const dbSingleton = require('../../dbSingleton.js');
const InvoiceGenerator = require('../../utils/invoiceGenerator.js');
const EmailService = require('../../utils/emailService.js');

const db = dbSingleton.getConnection();
const emailService = new EmailService();

// Create a new order (checkout)
exports.createOrder = async (req, res) => {
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

        // All orders start as Pending
        const initialStatus = 'Pending';
        
        const orderSql = `
            INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, promotion_id, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [orderResult] = await connection.query(orderSql, [user_id, total_amount, shipping_address, payment_method, promotion_id, initialStatus]);
        
        const orderId = orderResult.insertId;
        
        // Store PayPal payment ID if provided
        if (payment_method === 'paypal' && paypal_payment_id) {
            console.log('PayPal payment processed:', paypal_payment_id);
            // Store PayPal payment ID in a separate table or add a field to orders table
            // For now, we'll log it and handle it in the PayPal callback
        }

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

        // Get order items with product names and category_id for invoice
        const [itemsResult] = await connection.query(`
            SELECT oi.product_id, oi.quantity, oi.price, p.name as product_name, p.category_id
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `, [orderId]);

        // Get promotion details if applied (including applicable products and categories)
        let promotionDetails = null;
        if (promotion_id) {
            const [promotionResult] = await connection.query(
                'SELECT name, type, value, applicable_products, applicable_categories FROM promotions WHERE promotion_id = ?',
                [promotion_id]
            );
            if (promotionResult.length > 0) {
                promotionDetails = promotionResult[0];
            }
        }

        // Calculate discount amount (if promotion was applied) - only for applicable items
        let discountAmount = 0;
        if (promotionDetails) {
            // Parse applicable products and categories
            const applicableProducts = promotionDetails.applicable_products ? JSON.parse(promotionDetails.applicable_products) : [];
            const applicableCategories = promotionDetails.applicable_categories ? JSON.parse(promotionDetails.applicable_categories) : [];
            
            // Filter items to only those applicable to the promotion
            const applicableItems = itemsResult.filter(item => {
                // Check if item is in applicable products
                if (applicableProducts.length > 0 && applicableProducts.includes(item.product_id)) {
                    return true;
                }
                
                // Get item's category_id from products table
                // Note: itemsResult already has product_id, we need category_id
                // We'll need to join with products table or get category_id from items
                // For now, let's check if we have category_id in itemsResult
                // If not, we'll need to fetch it
                if (applicableCategories.length > 0) {
                    // Check if item has category_id (it should from the JOIN in the query above)
                    if (item.category_id && applicableCategories.includes(item.category_id)) {
                        return true;
                    }
                }
                
                return false;
            });
            
            // Calculate subtotal only for applicable items
            const applicableSubtotal = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            if (promotionDetails.type === 'percentage') {
                discountAmount = applicableSubtotal * (promotionDetails.value / 100);
            } else if (promotionDetails.type === 'fixed') {
                // For fixed discount, distribute proportionally among applicable items
                if (applicableSubtotal > 0) {
                    discountAmount = Math.min(parseFloat(promotionDetails.value), applicableSubtotal);
                } else {
                    discountAmount = 0;
                }
            }
            
            // Cap discount at subtotal to prevent negative totals (for both percentage and fixed)
            if (discountAmount > applicableSubtotal) {
                discountAmount = applicableSubtotal;
            }
            
            // Round to 2 decimal places
            discountAmount = Math.round(discountAmount * 100) / 100;
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
};

// Update order status after successful PayPal payment
exports.updateOrderStatusAfterPayment = async (req, res) => {
    const { orderId } = req.params;
    const { status, paypal_payment_id } = req.body;
    
    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }
    
    try {
        const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
        const [result] = await db.query(sql, [status, orderId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        
        console.log(`Order ${orderId} status updated to ${status}${paypal_payment_id ? ` with PayPal payment ID: ${paypal_payment_id}` : ''}`);
        
        res.json({ message: 'Order status updated successfully' });
    } catch (err) {
        console.error(`Error updating status for order ${orderId}:`, err);
        res.status(500).json({ message: 'Database error', details: err.message });
    }
};

// Get order history for a user
exports.getOrderHistory = async (req, res) => {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const userIdInt = parseInt(userId);
    if (req.user.user_id.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get total count of orders
        const countSql = `SELECT COUNT(DISTINCT o.order_id) as total FROM orders o WHERE o.user_id = ?`;
        const [countResult] = await db.query(countSql, [userIdInt]);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / parseInt(limit));

        // Get paginated order IDs first
        // Include order_date in SELECT to avoid MySQL strict mode error with DISTINCT + ORDER BY
        const orderIdsSql = `
            SELECT o.order_id, o.order_date
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.order_date DESC, o.order_id DESC
            LIMIT ? OFFSET ?
        `;
        const [orderIds] = await db.query(orderIdsSql, [userIdInt, parseInt(limit), offset]);
        const orderIdList = orderIds.map(row => row.order_id);

        if (orderIdList.length === 0) {
            return res.json({
                orders: [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: parseInt(limit)
                }
            });
        }

        // Get all items for these orders
        // Ensure orderIdList contains valid integers
        const validOrderIds = orderIdList.filter(id => id != null && !isNaN(id)).map(id => parseInt(id));
        
        if (validOrderIds.length === 0) {
            return res.json({
                orders: [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: parseInt(limit)
                }
            });
        }
        
        const placeholders = validOrderIds.map(() => '?').join(',');
        // Simplified query - fetch all data and sort in JavaScript to avoid MySQL strict mode issues
        const sql = `
            SELECT 
                o.order_id, 
                o.order_date, 
                o.total_amount, 
                o.status, 
                o.promotion_id,
                pr.code as promotion_code, 
                pr.name as promotion_name,
                pr.type as promotion_type,
                pr.value as promotion_value,
                pr.applicable_products,
                pr.applicable_categories,
                oi.product_id, 
                oi.quantity, 
                oi.price, 
                COALESCE(p.name, 'Product Not Found') as product_name, 
                COALESCE(p.image, '') as product_image,
                p.category_id
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN promotions pr ON o.promotion_id = pr.promotion_id
            WHERE o.order_id IN (${placeholders})
        `;
        const [rows] = await db.query(sql, validOrderIds);
        
        // Helper function to check if item is applicable to promotion
        const isItemApplicable = (item, promotion) => {
            if (!promotion || !promotion.promotion_id) return false;
            
            let applicableProducts = null;
            let applicableCategories = null;
            
            try {
                applicableProducts = promotion.applicable_products ? JSON.parse(promotion.applicable_products) : null;
            } catch (e) {
                console.error('Error parsing applicable_products:', e);
            }
            
            try {
                applicableCategories = promotion.applicable_categories ? JSON.parse(promotion.applicable_categories) : null;
            } catch (e) {
                console.error('Error parsing applicable_categories:', e);
            }
            
            // If no restrictions, promotion applies to all items
            if (!applicableProducts && !applicableCategories) return true;
            
            // Check if product is in applicable products list
            if (applicableProducts && Array.isArray(applicableProducts) && applicableProducts.includes(item.product_id)) {
                return true;
            }
            
            // Check if product category is in applicable categories list
            if (applicableCategories && Array.isArray(applicableCategories) && item.category_id && applicableCategories.includes(item.category_id)) {
                return true;
            }
            
            return false;
        };

        // Helper function to calculate item discount
        const calculateItemDiscount = (item, promotion) => {
            if (!promotion || !promotion.promotion_id || !isItemApplicable(item, promotion)) {
                return 0;
            }
            
            const itemTotal = parseFloat(item.price) * item.quantity;
            
            if (promotion.promotion_type === 'percentage') {
                return itemTotal * (parseFloat(promotion.promotion_value) / 100);
            } else if (promotion.promotion_type === 'fixed') {
                // For fixed discount, we need to calculate proportionally
                // This is a simplified version - in reality, we'd need the total of all applicable items
                // For now, we'll calculate based on this item's proportion
                return Math.min(parseFloat(promotion.promotion_value), itemTotal);
            }
            
            return 0;
        };

        // Group items by order
        const orders = {};
        rows.forEach(row => {
            if (!orders[row.order_id]) {
                orders[row.order_id] = {
                    order_id: row.order_id,
                    order_date: row.order_date,
                    total_amount: row.total_amount,
                    status: row.status,
                    promotion_id: row.promotion_id,
                    promotion_code: row.promotion_code,
                    promotion_name: row.promotion_name,
                    promotion_type: row.promotion_type,
                    promotion_value: row.promotion_value,
                    promotion_applicable_products: row.applicable_products,
                    promotion_applicable_categories: row.applicable_categories,
                    items: []
                };
            }
            // Only add item if product_id exists (not NULL)
            if (row.product_id) {
                const item = {
                    product_id: row.product_id,
                    product_name: row.product_name,
                    product_image: row.product_image,
                    quantity: row.quantity,
                    price: row.price,
                    category_id: row.category_id
                };
                
                // Calculate discount for this item if promotion exists
                const promotion = orders[row.order_id];
                let discount = 0;
                if (promotion.promotion_id) {
                    // First, we need to calculate total of all applicable items for proportional fixed discounts
                    // For now, we'll calculate a simple discount per item
                    const itemTotal = parseFloat(item.price) * item.quantity;
                    if (isItemApplicable(item, promotion)) {
                        if (promotion.promotion_type === 'percentage') {
                            discount = itemTotal * (parseFloat(promotion.promotion_value) / 100);
                        } else if (promotion.promotion_type === 'fixed') {
                            // For fixed discount, we'll need to calculate proportionally
                            // This requires knowing all items, so we'll do a simplified calculation
                            discount = Math.min(parseFloat(promotion.promotion_value), itemTotal);
                        }
                    }
                }
                
                item.discount = discount;
                item.price_after_discount = itemTotal - discount;
                
                orders[row.order_id].items.push(item);
            }
        });
        
        // For fixed discounts, recalculate proportionally across all applicable items
        Object.values(orders).forEach(order => {
            if (order.promotion_id && order.promotion_type === 'fixed') {
                const applicableItems = order.items.filter(item => 
                    isItemApplicable(item, order)
                );
                const totalApplicable = applicableItems.reduce((sum, item) => 
                    sum + (parseFloat(item.price) * item.quantity), 0
                );
                
                if (totalApplicable > 0) {
                    applicableItems.forEach(item => {
                        const itemTotal = parseFloat(item.price) * item.quantity;
                        const itemDiscount = (itemTotal / totalApplicable) * parseFloat(order.promotion_value);
                        item.discount = itemDiscount;
                        item.price_after_discount = itemTotal - itemDiscount;
                    });
                }
            }
        });

        // Sort orders by date (newest first) and convert to array
        const sortedOrders = Object.values(orders).sort((a, b) => {
            const dateA = new Date(a.order_date);
            const dateB = new Date(b.order_date);
            if (dateB - dateA !== 0) {
                return dateB - dateA; // Newest first
            }
            return b.order_id - a.order_id; // Higher ID first if same date
        });

        res.json({
            orders: sortedOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (err) {
        console.error('Error fetching order history:', err);
        console.error('Error details:', {
            userId,
            message: err.message,
            sqlState: err.sqlState,
            code: err.code,
            errno: err.errno,
            stack: err.stack
        });
        res.status(500).json({ 
            message: 'Database error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
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
};

// Get single order details (user can view their own orders, admin can view all)
exports.getOrderDetails = async (req, res) => {
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
                o.promotion_id,
                pr.code as promotion_code,
                pr.name as promotion_name,
                pr.type as promotion_type,
                pr.value as promotion_value,
                pr.applicable_products,
                pr.applicable_categories,
                u.name AS user_name,
                u.email AS user_email,
                oi.quantity,
                oi.price AS price_at_order,
                p.name AS product_name,
                p.category_id
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN promotions pr ON o.promotion_id = pr.promotion_id
            WHERE o.order_id = ? AND (o.user_id = ? OR ? = 'admin')
        `;
        const [rows] = await db.query(sql, [orderId, req.user.user_id, req.user.role]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Helper function to check if item is applicable to promotion
        const isItemApplicable = (item, promotion) => {
            if (!promotion || !promotion.promotion_id) return false;
            
            let applicableProducts = null;
            let applicableCategories = null;
            
            try {
                applicableProducts = promotion.applicable_products ? JSON.parse(promotion.applicable_products) : null;
            } catch (e) {
                console.error('Error parsing applicable_products:', e);
            }
            
            try {
                applicableCategories = promotion.applicable_categories ? JSON.parse(promotion.applicable_categories) : null;
            } catch (e) {
                console.error('Error parsing applicable_categories:', e);
            }
            
            // If no restrictions, promotion applies to all items
            if (!applicableProducts && !applicableCategories) return true;
            
            // Check if product is in applicable products list
            if (applicableProducts && Array.isArray(applicableProducts) && applicableProducts.includes(item.product_id)) {
                return true;
            }
            
            // Check if product category is in applicable categories list
            if (applicableCategories && Array.isArray(applicableCategories) && item.category_id && applicableCategories.includes(item.category_id)) {
                return true;
            }
            
            return false;
        };

        const promotion = rows[0].promotion_id ? {
            promotion_id: rows[0].promotion_id,
            promotion_code: rows[0].promotion_code,
            promotion_name: rows[0].promotion_name,
            promotion_type: rows[0].promotion_type,
            promotion_value: rows[0].promotion_value,
            applicable_products: rows[0].applicable_products,
            applicable_categories: rows[0].applicable_categories
        } : null;

        // First pass: collect all items
        const items = rows.map(row => ({
            product_id: row.product_id || null,
            product_name: row.product_name,
            quantity: row.quantity,
            price_at_order: row.price_at_order,
            category_id: row.category_id
        }));

        // Calculate discounts for each item
        let itemsWithDiscounts = items.map(item => {
            const itemTotal = parseFloat(item.price_at_order) * item.quantity;
            let discount = 0;
            
            if (promotion && isItemApplicable(item, promotion)) {
                if (promotion.promotion_type === 'percentage') {
                    discount = itemTotal * (parseFloat(promotion.promotion_value) / 100);
                } else if (promotion.promotion_type === 'fixed') {
                    // Will recalculate proportionally below
                    discount = Math.min(parseFloat(promotion.promotion_value), itemTotal);
                }
            }
            
            return {
                ...item,
                discount: discount,
                price_after_discount: itemTotal - discount
            };
        });

        // For fixed discounts, recalculate proportionally across all applicable items
        if (promotion && promotion.promotion_type === 'fixed') {
            const applicableItems = itemsWithDiscounts.filter(item => 
                isItemApplicable(item, promotion)
            );
            const totalApplicable = applicableItems.reduce((sum, item) => 
                sum + (parseFloat(item.price_at_order) * item.quantity), 0
            );
            
            if (totalApplicable > 0) {
                itemsWithDiscounts = itemsWithDiscounts.map(item => {
                    if (isItemApplicable(item, promotion)) {
                        const itemTotal = parseFloat(item.price_at_order) * item.quantity;
                        const itemDiscount = (itemTotal / totalApplicable) * parseFloat(promotion.promotion_value);
                        return {
                            ...item,
                            discount: itemDiscount,
                            price_after_discount: itemTotal - itemDiscount
                        };
                    }
                    return item;
                });
            }
        }

        // Group items into a single order object
        const orderDetails = {
            order_id: rows[0].order_id,
            order_date: rows[0].order_date,
            total_price: rows[0].total_price,
            status: rows[0].status,
            shipping_address: rows[0].shipping_address,
            payment_method: rows[0].payment_method,
            promotion_id: rows[0].promotion_id,
            promotion_code: rows[0].promotion_code,
            promotion_name: rows[0].promotion_name,
            promotion_type: rows[0].promotion_type,
            promotion_value: rows[0].promotion_value,
            user_name: rows[0].user_name,
            user_email: rows[0].user_email,
            products: itemsWithDiscounts.map(item => ({
                product_name: item.product_name,
                quantity: item.quantity,
                price_at_order: item.price_at_order,
                discount: item.discount,
                price_after_discount: item.price_after_discount
            })),
        };

        res.json(orderDetails);
    } catch (err) {
        console.error(`Error fetching details for order ${orderId}:`, err);
        res.status(500).json({ message: 'Database error' });
    }
};
