const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const {
    getSettings,
    updateSettings,
    getCurrencies
} = require('../controllers/settingsController.js');

const router = express.Router();

// Get all settings
router.get('/', getSettings);

// Update settings
router.put('/', authenticateToken, requireAdmin, updateSettings);

// Get available currencies
router.get('/currencies', getCurrencies);

module.exports = router; 