const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get all promotions (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [promotions] = await db.query("SELECT * FROM promotions ORDER BY start_date DESC");
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get active promotions (public)
router.get('/active', async (req, res) => {
    try {
        const sql = `
            SELECT * FROM promotions 
            WHERE start_date <= CURDATE() 
            AND end_date >= CURDATE()
            ORDER BY end_date ASC
        `;
        const [promotions] = await db.query(sql);
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching active promotions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a new promotion (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const {
        code, description, type, value,
        start_date, end_date, min_purchase,
        applicable_products, applicable_categories
    } = req.body;

    try {
        const sql = `
            INSERT INTO promotions (code, description, type, value, start_date, end_date, min_purchase, applicable_products, applicable_categories)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            code, description, type, value,
            start_date, end_date, min_purchase,
            JSON.stringify(applicable_products), JSON.stringify(applicable_categories)
        ]);
        res.status(201).json({ message: 'Promotion created successfully.' });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update a promotion (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const {
        code, description, type, value,
        start_date, end_date, min_purchase,
        applicable_products, applicable_categories
    } = req.body;

    try {
        const sql = `
            UPDATE promotions SET
            code = ?, description = ?, type = ?, value = ?, start_date = ?, end_date = ?,
            min_purchase = ?, applicable_products = ?, applicable_categories = ?
            WHERE promotion_id = ?
        `;
        const [result] = await db.query(sql, [
            code, description, type, value,
            start_date, end_date, min_purchase,
            JSON.stringify(applicable_products), JSON.stringify(applicable_categories),
            id
        ]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promotion not found.' });
        }
        res.json({ message: 'Promotion updated successfully.' });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete a promotion (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM promotions WHERE promotion_id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promotion not found.' });
        }
        res.json({ message: 'Promotion deleted successfully.' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

function isItemApplicable(item, promotion) {
    // ... (logic for checking if an item is applicable)
    // This will be filled in from the original file
    const applicableProducts = promotion.applicable_products ? JSON.parse(promotion.applicable_products) : [];
    const applicableCategories = promotion.applicable_categories ? JSON.parse(promotion.applicable_categories) : [];

    if (applicableProducts.length > 0 && !applicableProducts.includes(item.product_id)) {
        return false;
    }
    if (applicableCategories.length > 0 && !applicableCategories.includes(item.category_id)) {
        return false;
    }
    return true;
}

// Apply a promotion code (public)
router.post('/apply-promotion', async (req, res) => {
    const { code, cart } = req.body;
    if (!code || !cart) {
        return res.status(400).json({ message: 'Promotion code and cart are required.' });
    }

    try {
        const [promotions] = await db.query(
            "SELECT * FROM promotions WHERE code = ? AND start_date <= CURDATE() AND end_date >= CURDATE()",
            [code]
        );

        if (promotions.length === 0) {
            return res.status(404).json({ message: 'Invalid or expired promotion code.' });
        }

        const promotion = promotions[0];
        let discount = 0;
        let discounted_items = [];

        const totalCartAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        if (promotion.min_purchase && totalCartAmount < promotion.min_purchase) {
            return res.status(400).json({ message: `Minimum purchase of ${promotion.min_purchase} required.` });
        }

        if (promotion.type === 'percentage') {
            cart.forEach(item => {
                if (isItemApplicable(item, promotion)) {
                    discount += (item.price * item.quantity) * (promotion.value / 100);
                    discounted_items.push(item.product_id);
                }
            });
        } else if (promotion.type === 'fixed') {
            // Distribute fixed discount proportionally among applicable items
            const applicableTotal = cart.reduce((total, item) => {
                return isItemApplicable(item, promotion) ? total + (item.price * item.quantity) : total;
            }, 0);

            if (applicableTotal > 0) {
                cart.forEach(item => {
                    if (isItemApplicable(item, promotion)) {
                        const itemTotal = item.price * item.quantity;
                        const itemDiscount = (itemTotal / applicableTotal) * promotion.value;
                        discount += itemDiscount;
                        discounted_items.push(item.product_id);
                    }
                });
            }
        } else if (promotion.type === 'bogo') {
            // Buy One Get One Free logic
            cart.forEach(item => {
                if (isItemApplicable(item, promotion) && item.quantity >= 2) {
                    const pairs = Math.floor(item.quantity / 2);
                    discount += pairs * item.price;
                    discounted_items.push(item.product_id);
                }
            });
        }

        res.json({
            success: true,
            discount: parseFloat(discount.toFixed(2)),
            promotion_id: promotion.promotion_id,
            description: promotion.description,
            discounted_items
        });

    } catch (error) {
        console.error("Error applying promotion:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router; 