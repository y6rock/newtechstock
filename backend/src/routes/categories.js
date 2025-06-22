const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get all categories (public)
router.get('/public', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (err) {
        console.error('Database error in GET /categories/public:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get all categories (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (err) {
        console.error('Database error in GET /categories:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create a new category
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Category name cannot be empty.' });
    }
    try {
        const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name.trim()]);
        res.status(201).json({ message: 'Category added successfully', category_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A category with this name already exists.' });
        }
        console.error('Error adding category:', err);
        res.status(500).json({ message: 'Failed to add category due to a server error.' });
    }
});

// Update a category
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Category name cannot be empty.' });
    }
    try {
        const [result] = await db.query('UPDATE categories SET name = ? WHERE category_id = ?', [name.trim(), id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A category with this name already exists.' });
        }
        console.error(`Error updating category ${id}:`, err);
        res.status(500).json({ message: 'Failed to update category due to a server error.' });
    }
});

// Delete a category
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM categories WHERE category_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        // Check for foreign key constraint error
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Cannot delete category as it is currently in use by products.' });
        }
        console.error(`Error deleting category ${id}:`, err);
        res.status(500).json({ message: 'Failed to delete category due to a server error.' });
    }
});

module.exports = router; 