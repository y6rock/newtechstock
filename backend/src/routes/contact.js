const express = require('express');
const {
    submitContactForm,
    getContactMessages
} = require('../controllers/contactController.js');

const router = express.Router();

// Handle contact form submission
router.post('/', submitContactForm);

// Get all contact messages (admin only)
router.get('/', getContactMessages);

module.exports = router; 