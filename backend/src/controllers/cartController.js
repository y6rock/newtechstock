const dbSingleton = require('../../dbSingleton');

/**
 * Validate and synchronize cart items with current product data
 * Updates prices, removes deleted/out-of-stock products, validates availability
 */
const validateCart = async (req, res) => {
    try {
        const { cartItems } = req.body;
        
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return res.json({
                validatedCart: [],
                changes: [],
                removedItems: []
            });
        }

        const db = dbSingleton.getConnection();
        const productIds = cartItems.map(item => item.product_id);
        
        // Get current product data for all cart items
        const placeholders = productIds.map(() => '?').join(',');
        const query = `
            SELECT 
                p.product_id,
                p.name,
                p.price,
                p.stock,
                p.image,
                p.category_id,
                p.supplier_id,
                p.is_active,
                c.name as category_name,
                s.name as supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            WHERE p.product_id IN (${placeholders})
        `;
        
        const [currentProducts] = await db.execute(query, productIds);
        const currentProductsMap = new Map(currentProducts.map(p => [p.product_id, p]));
        
        const validatedCart = [];
        const changes = [];
        const removedItems = [];
        
        for (const cartItem of cartItems) {
            const currentProduct = currentProductsMap.get(cartItem.product_id);
            
            // Product was deleted or is inactive
            if (!currentProduct || currentProduct.is_active !== 1) {
                removedItems.push({
                    ...cartItem,
                    reason: !currentProduct ? 'Product deleted' : 'Product inactive'
                });
                continue;
            }
            
            // Product is out of stock
            if (currentProduct.stock === 0) {
                removedItems.push({
                    ...cartItem,
                    reason: 'Out of stock'
                });
                continue;
            }
            
            // Check if any changes occurred
            const itemChanges = [];
            let updatedItem = { ...cartItem };
            
            // Price changed
            if (parseFloat(currentProduct.price) !== parseFloat(cartItem.price)) {
                itemChanges.push({
                    field: 'price',
                    oldValue: parseFloat(cartItem.price),
                    newValue: parseFloat(currentProduct.price)
                });
                updatedItem.price = parseFloat(currentProduct.price);
            }
            
            // Name changed
            if (currentProduct.name !== cartItem.name) {
                itemChanges.push({
                    field: 'name',
                    oldValue: cartItem.name,
                    newValue: currentProduct.name
                });
                updatedItem.name = currentProduct.name;
            }
            
            // Image changed
            if (currentProduct.image !== cartItem.image) {
                itemChanges.push({
                    field: 'image',
                    oldValue: cartItem.image,
                    newValue: currentProduct.image
                });
                updatedItem.image = currentProduct.image;
            }
            
            // Category changed
            if (currentProduct.category_id !== cartItem.category_id) {
                itemChanges.push({
                    field: 'category',
                    oldValue: cartItem.category_id,
                    newValue: currentProduct.category_id
                });
                updatedItem.category_id = currentProduct.category_id;
            }
            
            // Supplier changed
            if (currentProduct.supplier_id !== cartItem.supplier_id) {
                itemChanges.push({
                    field: 'supplier',
                    oldValue: cartItem.supplier_id,
                    newValue: currentProduct.supplier_id
                });
                updatedItem.supplier_id = currentProduct.supplier_id;
            }
            
            // Quantity exceeds available stock
            if (cartItem.quantity > currentProduct.stock) {
                itemChanges.push({
                    field: 'quantity',
                    oldValue: cartItem.quantity,
                    newValue: currentProduct.stock,
                    reason: 'Quantity reduced to available stock'
                });
                updatedItem.quantity = currentProduct.stock;
            }
            
            // Update stock information
            updatedItem.stock = currentProduct.stock;
            
            // Add to changes if any occurred
            if (itemChanges.length > 0) {
                changes.push({
                    product_id: cartItem.product_id,
                    product_name: currentProduct.name,
                    changes: itemChanges
                });
            }
            
            validatedCart.push(updatedItem);
        }
        
        res.json({
            validatedCart,
            changes,
            removedItems,
            summary: {
                totalItems: cartItems.length,
                validItems: validatedCart.length,
                changedItems: changes.length,
                removedItems: removedItems.length
            }
        });
        
    } catch (error) {
        console.error('Error validating cart:', error);
        res.status(500).json({ 
            message: 'Failed to validate cart',
            error: error.message 
        });
    }
};

/**
 * Get current product information for cart items
 * Used for real-time validation during cart operations
 */
const getCartProductInfo = async (req, res) => {
    try {
        const { productIds } = req.body;
        
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.json([]);
        }

        const db = dbSingleton.getConnection();
        const placeholders = productIds.map(() => '?').join(',');
        
        const query = `
            SELECT 
                product_id,
                name,
                price,
                stock,
                image,
                category_id,
                supplier_id,
                is_active
            FROM products
            WHERE product_id IN (${placeholders}) AND is_active = 1
        `;
        
        const [products] = await db.execute(query, productIds);
        res.json(products);
        
    } catch (error) {
        console.error('Error getting cart product info:', error);
        res.status(500).json({ 
            message: 'Failed to get product information',
            error: error.message 
        });
    }
};

/**
 * Get user's cart from database
 */
const getCart = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const db = dbSingleton.getConnection();

        // Get or create cart for user
        let [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
        let cartId;
        
        if (carts.length === 0) {
            // Create new cart for user
            const [result] = await db.execute('INSERT INTO carts (user_id) VALUES (?)', [user_id]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].cart_id;
        }

        // Get cart items with product details
        const [cartItems] = await db.execute(`
            SELECT 
                ci.cart_item_id,
                ci.product_id,
                ci.quantity,
                ci.price as cart_price,
                p.name,
                p.price as current_price,
                p.stock,
                p.image,
                p.category_id,
                p.supplier_id,
                p.is_active,
                c.name as category_name,
                s.name as supplier_name
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            WHERE ci.cart_id = ? AND p.is_active = 1
            ORDER BY ci.added_at ASC
        `, [cartId]);

        // Get applied promotion if any
        const [promotions] = await db.execute(`
            SELECT 
                cp.discount_amount,
                p.promotion_id,
                p.name,
                p.code,
                p.value,
                p.type
            FROM cart_promotions cp
            JOIN promotions p ON cp.promotion_id = p.promotion_id
            WHERE cp.cart_id = ?
        `, [cartId]);

        const appliedPromotion = promotions.length > 0 ? {
            promotion_id: promotions[0].promotion_id,
            name: promotions[0].name,
            code: promotions[0].code,
            value: promotions[0].value,
            type: promotions[0].type
        } : null;

        const discountAmount = promotions.length > 0 ? parseFloat(promotions[0].discount_amount) : 0;

        res.json({
            cartItems: cartItems.map(item => ({
                product_id: item.product_id,
                name: item.name,
                price: parseFloat(item.cart_price), // Use cart price for consistency
                current_price: parseFloat(item.current_price),
                quantity: item.quantity,
                stock: item.stock,
                image: item.image,
                category_id: item.category_id,
                supplier_id: item.supplier_id,
                category_name: item.category_name,
                supplier_name: item.supplier_name
            })),
            appliedPromotion,
            discountAmount
        });

    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ message: 'Failed to get cart', error: error.message });
    }
};

/**
 * Add item to cart
 */
const addToCart = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { product_id, quantity = 1, price } = req.body;
        
        if (!product_id || !price) {
            return res.status(400).json({ message: 'Product ID and price are required' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        const db = dbSingleton.getConnection();

        // Verify product exists and is active
        const [products] = await db.execute('SELECT stock, is_active FROM products WHERE product_id = ?', [product_id]);
        if (products.length === 0 || !products[0].is_active) {
            return res.status(404).json({ message: 'Product not found or inactive' });
        }

        if (products[0].stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        // Get or create cart
        let [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
        let cartId;
        
        if (carts.length === 0) {
            const [result] = await db.execute('INSERT INTO carts (user_id) VALUES (?)', [user_id]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].cart_id;
        }

        // Check if item already exists in cart
        const [existingItems] = await db.execute('SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
        
        if (existingItems.length > 0) {
            // Update existing item
            const newQuantity = existingItems[0].quantity + quantity;
            if (newQuantity > products[0].stock) {
                return res.status(400).json({ message: 'Total quantity exceeds available stock' });
            }
            
            await db.execute('UPDATE cart_items SET quantity = ?, price = ? WHERE cart_id = ? AND product_id = ?', 
                [newQuantity, price, cartId, product_id]);
        } else {
            // Add new item
            await db.execute('INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', 
                [cartId, product_id, quantity, price]);
        }

        res.json({ message: 'Item added to cart successfully' });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
    }
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { product_id, quantity } = req.body;
        
        if (!product_id || quantity <= 0) {
            return res.status(400).json({ message: 'Product ID and valid quantity are required' });
        }

        const db = dbSingleton.getConnection();

        // Get user's cart
        const [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
        if (carts.length === 0) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const cartId = carts[0].cart_id;

        // Verify product stock
        const [products] = await db.execute('SELECT stock FROM products WHERE product_id = ? AND is_active = 1', [product_id]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (quantity > products[0].stock) {
            return res.status(400).json({ message: 'Quantity exceeds available stock' });
        }

        // Update cart item
        const [result] = await db.execute('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?', 
            [quantity, cartId, product_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        res.json({ message: 'Cart item updated successfully' });

    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Failed to update cart item', error: error.message });
    }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { product_id } = req.body;
        
        if (!product_id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const db = dbSingleton.getConnection();

        // Get user's cart
        const [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
        if (carts.length === 0) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const cartId = carts[0].cart_id;

        // Remove cart item
        const [result] = await db.execute('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', 
            [cartId, product_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        res.json({ message: 'Item removed from cart successfully' });

    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
    }
};

/**
 * Clear entire cart
 */
const clearCart = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const db = dbSingleton.getConnection();

        // Get user's cart
        const [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
        if (carts.length === 0) {
            return res.json({ message: 'Cart is already empty' });
        }

        const cartId = carts[0].cart_id;

        // Remove all cart items and promotions
        await db.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        await db.execute('DELETE FROM cart_promotions WHERE cart_id = ?', [cartId]);

        res.json({ message: 'Cart cleared successfully' });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Failed to clear cart', error: error.message });
    }
};

/**
 * Apply promotion to cart
 */
const applyPromotion = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { promotion_id, discount_amount } = req.body;
        
        if (!promotion_id || discount_amount === undefined) {
            return res.status(400).json({ message: 'Promotion ID and discount amount are required' });
        }

        const db = dbSingleton.getConnection();

        // Get user's cart
        const [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
        if (carts.length === 0) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const cartId = carts[0].cart_id;

        // Remove existing promotion if any
        await db.execute('DELETE FROM cart_promotions WHERE cart_id = ?', [cartId]);

        // Apply new promotion
        await db.execute('INSERT INTO cart_promotions (cart_id, promotion_id, discount_amount) VALUES (?, ?, ?)', 
            [cartId, promotion_id, discount_amount]);

        res.json({ message: 'Promotion applied successfully' });

    } catch (error) {
        console.error('Error applying promotion:', error);
        res.status(500).json({ message: 'Failed to apply promotion', error: error.message });
    }
};

/**
 * Remove promotion from cart
 */
const removePromotion = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const db = dbSingleton.getConnection();

        // Get user's cart
        const [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
        if (carts.length === 0) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const cartId = carts[0].cart_id;

        // Remove promotion
        await db.execute('DELETE FROM cart_promotions WHERE cart_id = ?', [cartId]);

        res.json({ message: 'Promotion removed successfully' });

    } catch (error) {
        console.error('Error removing promotion:', error);
        res.status(500).json({ message: 'Failed to remove promotion', error: error.message });
    }
};

module.exports = {
    validateCart,
    getCartProductInfo,
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyPromotion,
    removePromotion
};
