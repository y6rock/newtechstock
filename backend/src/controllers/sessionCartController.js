const dbSingleton = require('../../dbSingleton');

/**
 * Get session cart (works for both authenticated and anonymous users)
 */
const getSessionCart = async (req, res) => {
    try {
        // Initialize session cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = {
                items: [],
                appliedPromotion: null,
                discountAmount: 0
            };
        }

        // If user is authenticated, merge with database cart
        if (req.user) {
            const user_id = req.user.user_id;
            const db = dbSingleton.getConnection();

            // Get or create cart for user
            let [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
            let cartId;
            
            if (carts.length === 0) {
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
                type: promotions[0].type,
                discount_amount: promotions[0].discount_amount
            } : null;

            // Merge session cart with database cart
            const sessionItems = req.session.cart.items || [];
            const dbItems = cartItems.map(item => ({
                product_id: item.product_id,
                name: item.name,
                price: item.cart_price,
                image: item.image,
                quantity: item.quantity,
                stock: item.stock,
                category_name: item.category_name,
                supplier_name: item.supplier_name
            }));

            // Combine items, preferring database items for authenticated users
            const combinedItems = [...dbItems];
            
            // Add session items that aren't already in database
            sessionItems.forEach(sessionItem => {
                const existsInDb = dbItems.some(dbItem => dbItem.product_id === sessionItem.product_id);
                if (!existsInDb) {
                    combinedItems.push(sessionItem);
                }
            });

            req.session.cart = {
                items: combinedItems,
                appliedPromotion: appliedPromotion || req.session.cart.appliedPromotion,
                discountAmount: appliedPromotion ? appliedPromotion.discount_amount : req.session.cart.discountAmount
            };
        }

        res.json({
            cartItems: req.session.cart.items || [],
            appliedPromotion: req.session.cart.appliedPromotion,
            discountAmount: req.session.cart.discountAmount || 0,
            sessionId: req.sessionID // Include session ID for debugging
        });

    } catch (error) {
        console.error('Error getting session cart:', error);
        res.status(500).json({ message: 'Failed to get cart', error: error.message });
    }
};

/**
 * Add item to session cart
 */
const addToSessionCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        
        if (!product_id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than 0' });
        }

        // Initialize session cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = {
                items: [],
                appliedPromotion: null,
                discountAmount: 0
            };
        }

        const db = dbSingleton.getConnection();

        // Get product details
        const [products] = await db.execute(`
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
            WHERE p.product_id = ? AND p.is_active = 1
        `, [product_id]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found or inactive' });
        }

        const product = products[0];

        if (product.stock < quantity) {
            return res.status(400).json({ message: `Only ${product.stock} units available` });
        }

        // Check if item already exists in session cart
        const existingItemIndex = req.session.cart.items.findIndex(item => item.product_id === product_id);
        
        if (existingItemIndex >= 0) {
            // Update existing item quantity
            const newQuantity = req.session.cart.items[existingItemIndex].quantity + quantity;
            
            if (newQuantity > product.stock) {
                return res.status(400).json({ message: `Only ${product.stock} units available` });
            }
            
            req.session.cart.items[existingItemIndex].quantity = newQuantity;
            req.session.cart.items[existingItemIndex].price = product.price; // Update price
            req.session.cart.items[existingItemIndex].stock = product.stock; // Update stock
        } else {
            // Add new item
            req.session.cart.items.push({
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                stock: product.stock,
                category_name: product.category_name,
                supplier_name: product.supplier_name
            });
        }

        // If user is authenticated, also save to database
        if (req.user) {
            const user_id = req.user.user_id;

            // Get or create cart
            let [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
            let cartId;
            
            if (carts.length === 0) {
                const [result] = await db.execute('INSERT INTO carts (user_id) VALUES (?)', [user_id]);
                cartId = result.insertId;
            } else {
                cartId = carts[0].cart_id;
            }

            // Check if item already exists in database cart
            const [existingItems] = await db.execute('SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
            
            if (existingItems.length > 0) {
                // Update existing item
                const newQuantity = existingItems[0].quantity + quantity;
                await db.execute('UPDATE cart_items SET quantity = ?, price = ? WHERE cart_id = ? AND product_id = ?', 
                    [newQuantity, product.price, cartId, product_id]);
            } else {
                // Add new item
                await db.execute('INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', 
                    [cartId, product_id, quantity, product.price]);
            }
        }

        res.json({ 
            message: 'Item added to cart successfully',
            cartItems: req.session.cart.items
        });

    } catch (error) {
        console.error('Error adding to session cart:', error);
        res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
    }
};

/**
 * Update item quantity in session cart
 */
const updateSessionCartItem = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        
        if (!product_id || quantity === undefined) {
            return res.status(400).json({ message: 'Product ID and quantity are required' });
        }

        if (quantity < 0) {
            return res.status(400).json({ message: 'Quantity cannot be negative' });
        }

        // Initialize session cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = {
                items: [],
                appliedPromotion: null,
                discountAmount: 0
            };
        }

        const itemIndex = req.session.cart.items.findIndex(item => item.product_id === product_id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        if (quantity === 0) {
            // Remove item
            req.session.cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            const db = dbSingleton.getConnection();
            const [products] = await db.execute('SELECT stock FROM products WHERE product_id = ?', [product_id]);
            
            if (products.length === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (products[0].stock < quantity) {
                return res.status(400).json({ message: `Only ${products[0].stock} units available` });
            }

            req.session.cart.items[itemIndex].quantity = quantity;
            req.session.cart.items[itemIndex].stock = products[0].stock;
        }

        // If user is authenticated, also update database
        if (req.user) {
            const user_id = req.user.user_id;
            const db = dbSingleton.getConnection();

            const [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
            if (carts.length === 0) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            const cartId = carts[0].cart_id;

            if (quantity === 0) {
                await db.execute('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
            } else {
                await db.execute('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?', 
                    [quantity, cartId, product_id]);
            }
        }

        res.json({ 
            message: 'Cart item updated successfully',
            cartItems: req.session.cart.items
        });

    } catch (error) {
        console.error('Error updating session cart item:', error);
        res.status(500).json({ message: 'Failed to update cart item', error: error.message });
    }
};

/**
 * Remove item from session cart
 */
const removeFromSessionCart = async (req, res) => {
    try {
        const { product_id } = req.body;
        
        if (!product_id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Initialize session cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = {
                items: [],
                appliedPromotion: null,
                discountAmount: 0
            };
        }

        const itemIndex = req.session.cart.items.findIndex(item => item.product_id === product_id);
        
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        req.session.cart.items.splice(itemIndex, 1);

        // If user is authenticated, also remove from database
        if (req.user) {
            const user_id = req.user.user_id;
            const db = dbSingleton.getConnection();

            const [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
            if (carts.length > 0) {
                const cartId = carts[0].cart_id;
                await db.execute('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
            }
        }

        res.json({ 
            message: 'Item removed from cart successfully',
            cartItems: req.session.cart.items
        });

    } catch (error) {
        console.error('Error removing from session cart:', error);
        res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
    }
};

/**
 * Clear session cart
 */
const clearSessionCart = async (req, res) => {
    try {
        req.session.cart = {
            items: [],
            appliedPromotion: null,
            discountAmount: 0
        };

        // If user is authenticated, also clear database cart
        if (req.user) {
            const user_id = req.user.user_id;
            const db = dbSingleton.getConnection();

            const [carts] = await db.execute('SELECT cart_id FROM carts WHERE user_id = ?', [user_id]);
            if (carts.length > 0) {
                const cartId = carts[0].cart_id;
                await db.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
                await db.execute('DELETE FROM cart_promotions WHERE cart_id = ?', [cartId]);
            }
        }

        res.json({ message: 'Cart cleared successfully' });

    } catch (error) {
        console.error('Error clearing session cart:', error);
        res.status(500).json({ message: 'Failed to clear cart', error: error.message });
    }
};

module.exports = {
    getSessionCart,
    addToSessionCart,
    updateSessionCartItem,
    removeFromSessionCart,
    clearSessionCart
};
