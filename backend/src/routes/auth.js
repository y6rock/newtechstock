const express = require('express');
const { authenticateToken } = require('../middleware/auth.js');
const loginLimiter = require('../../utils/loginLimiter.js');
const {
    uploadImage,
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    upload
} = require('../controllers/authController.js');

const router = express.Router();

// POST route for uploading an image
router.post('/upload-image', authenticateToken, upload.single('image'), uploadImage);

// Register user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user profile
router.get('/profile', authenticateToken, getProfile);

// Update user profile
router.put('/profile', authenticateToken, updateProfile);

// Change password
router.put('/change-password', authenticateToken, changePassword);

// Request password reset
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password/:token', resetPassword);

module.exports = router;