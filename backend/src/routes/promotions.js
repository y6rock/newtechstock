const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    getAllPromotions,
    getActivePromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    deactivateExpired,
    applyPromotion,
    applyPromotionAdvanced
} = require('../controllers/promotionController.js');

const router = express.Router();

// Get all promotions (admin only)
router.get('/', authenticateToken, requireAdmin, getAllPromotions);

// Get active promotions (public)
router.get('/active', getActivePromotions);

// Create a new promotion (admin only)
router.post('/', authenticateToken, requireAdmin, createPromotion);

// Update a promotion (admin only)
router.put('/:id', authenticateToken, requireAdmin, updatePromotion);

// Delete a promotion (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deletePromotion);

// Deactivate expired promotions (admin only)
router.post('/deactivate-expired', authenticateToken, requireAdmin, deactivateExpired);

// Apply promotion to cart (public)
router.post('/apply', applyPromotion);

// Apply promotion with advanced logic (public)
router.post('/apply-promotion', applyPromotionAdvanced);

module.exports = router;