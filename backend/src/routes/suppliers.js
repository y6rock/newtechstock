const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    getPublicSuppliers,
    getAllSuppliers,
    getSupplierStats,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    restoreSupplier
} = require('../controllers/supplierController.js');

const router = express.Router();

// Get all suppliers (public) - shows only active suppliers
router.get('/public', getPublicSuppliers);

// Get supplier statistics (global counts)
router.get('/stats', authenticateToken, requireAdmin, getSupplierStats);

// Get all suppliers (admin only) - shows both active and inactive
router.get('/', authenticateToken, requireAdmin, getAllSuppliers);

// Add a new supplier
router.post('/', authenticateToken, requireAdmin, createSupplier);

// Update a supplier
router.put('/:id', authenticateToken, requireAdmin, updateSupplier);

// Soft delete a supplier (set isActive to false)
router.delete('/:id', authenticateToken, requireAdmin, deleteSupplier);

// Restore a deactivated supplier (set isActive to true)
router.patch('/:id/restore', authenticateToken, requireAdmin, restoreSupplier);

module.exports = router; 