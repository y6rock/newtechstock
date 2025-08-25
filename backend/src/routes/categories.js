const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get all categories (public)
router.get('/public', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories WHERE isActive = TRUE ORDER BY name');
        res.json(categories);
    } catch (err) {
        console.error('Database error in GET /categories/public:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get all categories (admin only) - shows both active and inactive
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [categories] = await db.query('SELECT *, CASE WHEN isActive = TRUE THEN "Active" ELSE "Inactive" END as status FROM categories ORDER BY name');
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

// Soft delete a category (set isActive to false)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('UPDATE categories SET isActive = FALSE WHERE category_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category deactivated successfully' });
    } catch (err) {
        console.error(`Error deactivating category ${id}:`, err);
        res.status(500).json({ message: 'Failed to deactivate category due to a server error.' });
    }
});

// Restore a deactivated category (set isActive to true)
router.patch('/:id/restore', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('UPDATE categories SET isActive = TRUE WHERE category_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category restored successfully' });
    } catch (err) {
        console.error(`Error restoring category ${id}:`, err);
        res.status(500).json({ message: 'Failed to restore category due to a server error.' });
    }
});

module.exports = router; 