const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    getAllProducts,
    getPriceStats,
    searchProducts,
    getProductById,
    getProductsByIds,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProductsAdmin,
    restoreProduct,
    getProductStats
} = require('../controllers/productController.js');

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

// Get all products (public) - only active products
router.get('/', getAllProducts);

// Get price statistics for slider (min, max prices)
router.get('/price-stats', getPriceStats);

// Search products (public) - returns name, image, price for dropdown
router.get('/search', searchProducts);

// Get a single product by ID (public) - only active products
router.get('/:id', getProductById);

// Get products by multiple IDs (public) - only active products
router.get('/by-ids', getProductsByIds);

// Create a new product (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), createProduct);

// Update a product (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateProduct);

// Soft delete a product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

// Get all products including inactive (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, getAllProductsAdmin);

// Get product statistics (admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, getProductStats);

// Restore a deactivated product (admin only)
router.patch('/:id/restore', authenticateToken, requireAdmin, restoreProduct);

module.exports = router; 