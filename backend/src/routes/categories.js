const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    getPublicCategories,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    toggleCategoryStatus
} = require('../controllers/categoryController.js');

const router = express.Router();

// Get all categories (public)
router.get('/public', getPublicCategories);

// Get all categories (admin only) - shows both active and inactive
router.get('/', authenticateToken, requireAdmin, getAllCategories);

// Create a new category
router.post('/', authenticateToken, requireAdmin, createCategory);

// Update a category
router.put('/:id', authenticateToken, requireAdmin, updateCategory);

// Soft delete a category (set isActive to false)
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

// Restore a deactivated category (set isActive to true)
router.patch('/:id/restore', authenticateToken, requireAdmin, restoreCategory);

// Toggle category status (active/inactive)
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, toggleCategoryStatus);

module.exports = router; 