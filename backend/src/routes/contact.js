const express = require('express');
const {
    submitContactForm
} = require('../controllers/contactController.js');

const router = express.Router();

// Handle contact form submission
router.post('/', submitContactForm);

module.exports = router; 