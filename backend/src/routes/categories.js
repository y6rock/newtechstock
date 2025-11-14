const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    getPublicCategories,
    getAllCategories,
    getCategoriesByIds,
    getCategoryStats,
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    toggleCategoryStatus
} = require('../controllers/categoryController.js');

const router = express.Router();

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

// Get all categories (public)
router.get('/public', getPublicCategories);

// Get categories by multiple IDs (public)
router.get('/by-ids', getCategoriesByIds);

// Get category statistics (global counts)
router.get('/stats', authenticateToken, requireAdmin, getCategoryStats);

// Get all categories (admin only) - shows both active and inactive
router.get('/', authenticateToken, requireAdmin, getAllCategories);

// Create a new category
router.post('/', authenticateToken, requireAdmin, upload.single('image'), createCategory);

// Update a category
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateCategory);

// Soft delete a category (set isActive to false)
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

// Restore a deactivated category (set isActive to true)
router.patch('/:id/restore', authenticateToken, requireAdmin, restoreCategory);

// Toggle category status (active/inactive)
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, toggleCategoryStatus);

module.exports = router; 