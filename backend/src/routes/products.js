const express = require('express');
const multer = require('multer');
const path = require('path');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const { isValidPrice, isValidStock } = require('../../utils/validation.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get all products (public)
router.get('/', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get a single product by ID (public)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [products] = await db.query('SELECT * FROM products WHERE product_id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(products[0]);
    } catch (err) {
        console.error(`Error fetching product ${id}:`, err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create a new product (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    const { name, description, price, stock, supplier_id, category_id } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
  
    if (!name || !price || !stock || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isValidPrice(price)) {
        return res.status(400).json({ message: 'Invalid price value' });
    }
    if (!isValidStock(stock)) {
        return res.status(400).json({ message: 'Invalid stock value' });
    }

    try {
        const [existingProducts] = await db.query('SELECT product_id FROM products WHERE name = ?', [name]);
        if (existingProducts.length > 0) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        const sql = `INSERT INTO products (name, description, price, stock, image, supplier_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [name, description, price, stock, image, supplier_id, category_id]);
        res.json({ message: 'Product added successfully' });
    } catch (err) {
        console.error('Database error adding product:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
    }
});

// Update a product (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, supplier_id, category_id } = req.body;
    let image = req.body.image;
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
    }

    if (!name || !price || !stock || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isValidPrice(price)) {
        return res.status(400).json({ message: 'Invalid price value' });
    }
    if (!isValidStock(stock)) {
        return res.status(400).json({ message: 'Invalid stock value' });
    }

    try {
        const [existingProducts] = await db.query('SELECT product_id FROM products WHERE name = ? AND product_id != ?', [name, id]);
        if (existingProducts.length > 0) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        const sql = `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = ?, supplier_id = ?, category_id = ? WHERE product_id = ?`;
        const [result] = await db.query(sql, [name, description, price, stock, image, supplier_id, category_id, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
});

// Delete a product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM products WHERE product_id = ?`;
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
});

module.exports = router; 