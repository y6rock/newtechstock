const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    getAllProducts,
    getPriceStats,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProductsAdmin,
    restoreProduct
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

// Get a single product by ID (public) - only active products
router.get('/:id', getProductById);

// Create a new product (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), createProduct);

// Update a product (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateProduct);

// Soft delete a product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

// Get all products including inactive (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, getAllProductsAdmin);

// Restore a deactivated product (admin only)
router.patch('/:id/restore', authenticateToken, requireAdmin, restoreProduct);

module.exports = router; 