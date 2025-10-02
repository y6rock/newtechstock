const dbSingleton = require('../../dbSingleton.js');

const db = dbSingleton.getConnection();

// Helper function to check if item is applicable for promotion
function isItemApplicable(item, promotion) {
    const applicableProducts = promotion.applicable_products ? JSON.parse(promotion.applicable_products) : [];
    const applicableCategories = promotion.applicable_categories ? JSON.parse(promotion.applicable_categories) : [];
    
    // Check if item is in applicable products
    if (applicableProducts.length > 0 && applicableProducts.includes(item.product_id)) {
        return true;
    }
    
    // Check if item's category is in applicable categories
    if (applicableCategories.length > 0 && applicableCategories.includes(item.category_id)) {
        return true;
    }
    
    // If no specific products or categories, promotion applies to all
    if (applicableProducts.length === 0 && applicableCategories.length === 0) {
        return true;
    }
    
    return false;
}

// Helper function to deactivate expired promotions
async function deactivateExpiredPromotions() {
    try {
        const sql = `
            UPDATE promotions 
            SET is_active = FALSE 
            WHERE end_date < CURDATE() 
            AND is_active = TRUE
        `;
        await db.query(sql);
    } catch (error) {
        console.error('Error deactivating expired promotions:', error);
    }
}

// Get all promotions (admin only) with pagination
exports.getAllPromotions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        // First, automatically deactivate expired promotions
        await deactivateExpiredPromotions();
        
        let whereConditions = [];
        let params = [];
        
        if (search) {
            whereConditions.push('(name LIKE ? OR description LIKE ? OR code LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Get total count
        const countSql = `SELECT COUNT(*) as total FROM promotions ${whereClause}`;
        const [countResult] = await db.query(countSql, params);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        
        // Get paginated promotions
        const sql = `SELECT * FROM promotions ${whereClause} ORDER BY start_date DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        const [promotions] = await db.query(sql, params);
        
        res.json({
            promotions,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get active promotions (public)
exports.getActivePromotions = async (req, res) => {
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
};

// Create a new promotion (admin only)
exports.createPromotion = async (req, res) => {
    const {
        name, code, description, type, value,
        startDate, endDate, minQuantity, maxQuantity, isActive,
        applicableProducts, applicableCategories
    } = req.body;

    try {
        // Check if promotion name already exists
        const [existingPromotion] = await db.query(
            'SELECT promotion_id FROM promotions WHERE name = ?',
            [name]
        );

        if (existingPromotion.length > 0) {
            return res.status(400).json({ 
                message: 'A promotion with this name already exists. Please choose a different name.' 
            });
        }

        const sql = `
            INSERT INTO promotions (name, code, description, type, value, start_date, end_date, 
            min_quantity, max_quantity, is_active, applicable_products, applicable_categories)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [
            name, code, description, type, value,
            startDate, endDate, minQuantity, maxQuantity, isActive,
            JSON.stringify(applicableProducts || []),
            JSON.stringify(applicableCategories || [])
        ]);

        res.status(201).json({ 
            message: 'Promotion created successfully',
            promotionId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a promotion (admin only)
exports.updatePromotion = async (req, res) => {
    const { id } = req.params;
    const {
        name, code, description, type, value,
        startDate, endDate, minQuantity, maxQuantity, isActive,
        applicableProducts, applicableCategories
    } = req.body;

    try {
        // Check if another promotion with the same name exists (excluding current promotion)
        const [existingPromotion] = await db.query(
            'SELECT promotion_id FROM promotions WHERE name = ? AND promotion_id != ?',
            [name, id]
        );

        if (existingPromotion.length > 0) {
            return res.status(400).json({ 
                message: 'A promotion with this name already exists. Please choose a different name.' 
            });
        }

        const sql = `
            UPDATE promotions 
            SET name = ?, code = ?, description = ?, type = ?, value = ?, 
                start_date = ?, end_date = ?, min_quantity = ?, max_quantity = ?, 
                is_active = ?, applicable_products = ?, applicable_categories = ?
            WHERE promotion_id = ?
        `;
        
        const [result] = await db.query(sql, [
            name, code, description, type, value,
            startDate, endDate, minQuantity, maxQuantity, isActive,
            JSON.stringify(applicableProducts || []),
            JSON.stringify(applicableCategories || []),
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        res.json({ message: 'Promotion updated successfully' });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a promotion (admin only)
exports.deletePromotion = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query('DELETE FROM promotions WHERE promotion_id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Deactivate expired promotions (admin only)
exports.deactivateExpired = async (req, res) => {
    try {
        await deactivateExpiredPromotions();
        res.json({ message: 'Expired promotions deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating expired promotions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Apply promotion to cart (public)
exports.applyPromotion = async (req, res) => {
    const { promotionCode, cartItems } = req.body;

    try {
        // Find the promotion by code
        const [promotions] = await db.query(
            'SELECT * FROM promotions WHERE code = ? AND is_active = TRUE',
            [promotionCode]
        );

        if (promotions.length === 0) {
            return res.status(404).json({ message: 'Invalid promotion code' });
        }

        const promotion = promotions[0];

        // Check if promotion is currently active
        const currentDate = new Date().toISOString().split('T')[0];
        if (promotion.start_date > currentDate || promotion.end_date < currentDate) {
            return res.status(400).json({ message: 'Promotion is not currently active' });
        }

        // Calculate discount for each cart item
        let totalDiscount = 0;
        const itemDiscounts = [];

        for (const item of cartItems) {
            if (isItemApplicable(item, promotion)) {
                let itemDiscount = 0;
                
                if (promotion.type === 'percentage') {
                    itemDiscount = (item.price * item.quantity) * (promotion.value / 100);
                } else if (promotion.type === 'fixed') {
                    itemDiscount = Math.min(promotion.value, item.price * item.quantity);
                }
                
                totalDiscount += itemDiscount;
                itemDiscounts.push({
                    productId: item.product_id,
                    discount: itemDiscount
                });
            }
        }

        res.json({
            success: true,
            totalDiscount,
            itemDiscounts,
            promotion: {
                name: promotion.name,
                type: promotion.type,
                value: promotion.value
            }
        });
    } catch (error) {
        console.error('Error applying promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Apply promotion with advanced logic (public)
exports.applyPromotionAdvanced = async (req, res) => {
    const { code, cart } = req.body;

    try {
        // Find the promotion
        const [promotions] = await db.query(
            'SELECT * FROM promotions WHERE code = ? AND is_active = TRUE',
            [code]
        );

        if (promotions.length === 0) {
            return res.status(404).json({ message: 'Invalid promotion code' });
        }

        const promotion = promotions[0];

        // Check if promotion is currently active
        const currentDate = new Date().toISOString().split('T')[0];
        if (promotion.start_date > currentDate || promotion.end_date < currentDate) {
            return res.status(400).json({ message: 'Promotion is not currently active' });
        }

        // Calculate total cart amount
        const totalCartAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

        // Check minimum purchase requirement
        if (promotion.min_purchase && totalCartAmount < promotion.min_purchase) {
            return res.status(400).json({ message: `Minimum purchase of ${promotion.min_purchase} required.` });
        }

        // Check which items are applicable
        let applicableItems = [];
        cart.forEach(item => {
            const isApplicable = isItemApplicable(item, promotion);
            if (isApplicable) {
                applicableItems.push(item);
            }
        });

        if (applicableItems.length === 0) {
            return res.status(400).json({ message: 'No items are eligible for this promotion.' });
        }

        // Check total quantity requirements for applicable items
        const totalApplicableQuantity = applicableItems.reduce((total, item) => total + item.quantity, 0);
        
        if (promotion.min_quantity && totalApplicableQuantity < promotion.min_quantity) {
            return res.status(400).json({ 
                message: `Minimum quantity required: ${promotion.min_quantity}. You have ${totalApplicableQuantity} applicable items.` 
            });
        }
        
        if (promotion.max_quantity && totalApplicableQuantity > promotion.max_quantity) {
            return res.status(400).json({ 
                message: `Maximum quantity allowed: ${promotion.max_quantity}. You have ${totalApplicableQuantity} applicable items.` 
            });
        }

        let discount = 0;
        let discounted_items = [];

        if (promotion.type === 'percentage') {
            applicableItems.forEach(item => {
                discount += (item.price * item.quantity) * (promotion.value / 100);
                discounted_items.push(item.product_id);
            });
        } else if (promotion.type === 'fixed') {
            // Distribute fixed discount proportionally among applicable items
            const applicableTotal = applicableItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            if (applicableTotal > 0) {
                applicableItems.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    const itemDiscount = (itemTotal / applicableTotal) * promotion.value;
                    discount += itemDiscount;
                    discounted_items.push(item.product_id);
                });
            }
        } else if (promotion.type === 'buy_x_get_y') {
            // Buy X Get Y Free logic
            const buyQuantity = promotion.buy_quantity || 1;
            const getQuantity = promotion.get_quantity || 1;
            
            applicableItems.forEach(item => {
                const sets = Math.floor(item.quantity / buyQuantity);
                const freeItems = sets * getQuantity;
                const freeValue = Math.min(freeItems, item.quantity) * item.price;
                discount += freeValue;
                discounted_items.push(item.product_id);
            });
        }

        res.json({
            success: true,
            discount: Math.round(discount * 100) / 100,
            discounted_items,
            promotion: {
                name: promotion.name,
                type: promotion.type,
                value: promotion.value
            }
        });
    } catch (error) {
        console.error('Error applying promotion:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
