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

        // Session cart is now fully session-based
        // No database integration needed

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

        res.json({ message: 'Cart cleared successfully' });

    } catch (error) {
        console.error('Error clearing session cart:', error);
        res.status(500).json({ message: 'Failed to clear cart', error: error.message });
    }
};

/**
 * Validate and synchronize cart items with current product data
 * Updates prices, removes deleted/out-of-stock products, validates availability
 */
const validateSessionCart = async (req, res) => {
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
        
        // Update session cart with validated items
        if (req.session.cart) {
            req.session.cart.items = validatedCart;
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
        console.error('Error validating session cart:', error);
        res.status(500).json({ 
            message: 'Failed to validate cart',
            error: error.message 
        });
    }
};

module.exports = {
    getSessionCart,
    addToSessionCart,
    updateSessionCartItem,
    removeFromSessionCart,
    clearSessionCart,
    validateSessionCart
};
