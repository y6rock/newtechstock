const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const EmailService = require('../../utils/emailService.js');

const router = express.Router();
const db = dbSingleton.getConnection();
const emailService = new EmailService();

// Handle contact form submission
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    try {
        // Store contact message in database
        const [result] = await db.query(
            'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );

        // Send notification email to admin (if email service is configured)
        try {
            await emailService.sendContactNotification(name, email, message);
        } catch (emailError) {
            console.log('Contact notification email not sent (email service not configured)');
        }

        res.json({ 
            message: 'Thank you for your message! We will get back to you soon.',
            contactId: result.insertId 
        });

    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }
});

// Get all contact messages (admin only)
router.get('/', async (req, res) => {
    try {
        const [messages] = await db.query(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
        );
        res.json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

module.exports = router; 