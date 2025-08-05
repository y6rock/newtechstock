const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get all promotions (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // First, automatically deactivate expired promotions
        await deactivateExpiredPromotions();
        
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
        name, code, description, type, value,
        startDate, endDate, minQuantity, maxQuantity, isActive,
        applicableProducts, applicableCategories
    } = req.body;

    try {
        const sql = `
            INSERT INTO promotions (name, code, description, type, value, start_date, end_date, 
            min_quantity, max_quantity, is_active, applicable_products, applicable_categories)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            name, code, description, type, value,
            startDate, endDate, minQuantity || 1, maxQuantity || null, isActive ? 1 : 0,
            JSON.stringify(applicableProducts || []), JSON.stringify(applicableCategories || [])
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
        name, code, description, type, value,
        startDate, endDate, minQuantity, maxQuantity, isActive,
        applicableProducts, applicableCategories
    } = req.body;

    try {
        const sql = `
            UPDATE promotions SET
            name = ?, code = ?, description = ?, type = ?, value = ?, 
            start_date = ?, end_date = ?, min_quantity = ?, max_quantity = ?, is_active = ?,
            applicable_products = ?, applicable_categories = ?
            WHERE promotion_id = ?
        `;
        const [result] = await db.query(sql, [
            name, code, description, type, value,
            startDate, endDate, minQuantity || 1, maxQuantity || null, isActive ? 1 : 0,
            JSON.stringify(applicableProducts || []), JSON.stringify(applicableCategories || []),
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

// Manually deactivate expired promotions (admin only)
router.post('/deactivate-expired', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query(`
            UPDATE promotions 
            SET is_active = 0 
            WHERE end_date < CURDATE() AND is_active = 1
        `);
        
        res.json({ 
            message: `Deactivated ${result.affectedRows} expired promotions.`,
            deactivatedCount: result.affectedRows
        });
    } catch (error) {
        console.error('Error deactivating expired promotions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

function isItemApplicable(item, promotion) {
    const applicableProducts = promotion.applicable_products ? JSON.parse(promotion.applicable_products) : [];
    const applicableCategories = promotion.applicable_categories ? JSON.parse(promotion.applicable_categories) : [];

    // Convert to strings for comparison since JSON.parse returns strings
    const itemProductId = item.product_id.toString();
    const itemCategoryId = item.category_id ? item.category_id.toString() : null;

    if (applicableProducts.length > 0 && !applicableProducts.includes(itemProductId)) {
        return false;
    }
    if (applicableCategories.length > 0 && !applicableCategories.includes(itemCategoryId)) {
        return false;
    }
    return true;
}

// Apply a promotion code (public) - Frontend calls this endpoint
router.post('/apply', async (req, res) => {
    const { promotionCode, cartItems } = req.body;
    if (!promotionCode || !cartItems) {
        return res.status(400).json({ message: 'Promotion code and cart items are required.' });
    }

    console.log('Applying promotion code:', promotionCode);
    console.log('Cart items:', cartItems);

    try {
        const [promotions] = await db.query(
            "SELECT * FROM promotions WHERE code = ? AND start_date <= CURDATE() AND end_date >= CURDATE() AND is_active = 1",
            [promotionCode]
        );

        if (promotions.length === 0) {
            console.log('No valid promotion found for code:', promotionCode);
            return res.status(404).json({ message: 'Invalid or expired promotion code.' });
        }

        const promotion = promotions[0];
        console.log('Found promotion:', promotion);
        
        let totalDiscount = 0;
        let discountedItems = [];

        const totalCartAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        console.log('Total cart amount:', totalCartAmount);
        
        if (promotion.min_purchase && totalCartAmount < promotion.min_purchase) {
            console.log('Minimum purchase not met:', promotion.min_purchase);
            return res.status(400).json({ message: `Minimum purchase of ${promotion.min_purchase} required.` });
        }

        // Check which items are applicable
        cartItems.forEach(item => {
            const isApplicable = isItemApplicable(item, promotion);
            console.log(`Item ${item.product_id} (category ${item.category_id}) applicable:`, isApplicable);
        });

        if (promotion.type === 'percentage') {
            cartItems.forEach(item => {
                if (isItemApplicable(item, promotion)) {
                    totalDiscount += (item.price * item.quantity) * (promotion.value / 100);
                    discountedItems.push(item.product_id);
                }
            });
        } else if (promotion.type === 'fixed') {
            // Distribute fixed discount proportionally among applicable items
            const applicableTotal = cartItems.reduce((total, item) => {
                return isItemApplicable(item, promotion) ? total + (item.price * item.quantity) : total;
            }, 0);

            console.log('Applicable total for fixed discount:', applicableTotal);

            if (applicableTotal > 0) {
                cartItems.forEach(item => {
                    if (isItemApplicable(item, promotion)) {
                        const itemTotal = item.price * item.quantity;
                        const itemDiscount = (itemTotal / applicableTotal) * promotion.value;
                        totalDiscount += itemDiscount;
                        discountedItems.push(item.product_id);
                    }
                });
            }
        } else if (promotion.type === 'bogo') {
            // Buy One Get One Free logic
            cartItems.forEach(item => {
                if (isItemApplicable(item, promotion) && item.quantity >= 2) {
                    const pairs = Math.floor(item.quantity / 2);
                    totalDiscount += pairs * item.price;
                    discountedItems.push(item.product_id);
                }
            });
        }

        console.log('Final discount:', totalDiscount);
        console.log('Discounted items:', discountedItems);

        res.json({
            promotion: {
                promotion_id: promotion.promotion_id,
                name: promotion.name || promotion.description,
                code: promotion.code,
                type: promotion.type,
                value: promotion.value
            },
            totalDiscount: parseFloat(totalDiscount.toFixed(2)),
            discountedItems
        });

    } catch (error) {
        console.error("Error applying promotion:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Apply a promotion code (public) - Original endpoint
router.post('/apply-promotion', async (req, res) => {
    const { code, cart } = req.body;
    if (!code || !cart) {
        return res.status(400).json({ message: 'Promotion code and cart are required.' });
    }

    try {
        const [promotions] = await db.query(
            "SELECT * FROM promotions WHERE code = ? AND start_date <= CURDATE() AND end_date >= CURDATE() AND is_active = 1",
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

// Function to automatically deactivate expired promotions
async function deactivateExpiredPromotions() {
    try {
        const sql = `
            UPDATE promotions 
            SET is_active = 0 
            WHERE end_date < CURDATE() AND is_active = 1
        `;
        const [result] = await db.query(sql);
        if (result.affectedRows > 0) {
            console.log(`Deactivated ${result.affectedRows} expired promotions`);
        }
    } catch (error) {
        console.error('Error deactivating expired promotions:', error);
    }
}

module.exports = router; 