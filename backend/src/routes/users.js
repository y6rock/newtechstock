const express = require('express');
const { authenticateToken } = require('../middleware/auth.js');
const {
    getUserProfile,
    updateUserProfile
} = require('../controllers/userController.js');

const router = express.Router();

// Get user profile by ID
router.get('/:id', authenticateToken, getUserProfile);

// Update user profile
router.put('/:id', authenticateToken, updateUserProfile);

module.exports = router; 