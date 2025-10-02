const EmailService = require('../../utils/emailService.js');

const emailService = new EmailService();

// Handle contact form submission
exports.submitContactForm = async (req, res) => {
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
        // Send notification email to admin (if email service is configured)
        try {
            await emailService.sendContactNotification(name, email, message);
            console.log(`Contact form submission from ${name} (${email}) sent via email`);
        } catch (emailError) {
            console.log('Contact notification email not sent (email service not configured)');
            console.log('Contact form submission details:', { name, email, message: message.substring(0, 100) + '...' });
        }

        res.json({ 
            message: 'Thank you for your message! We will get back to you soon.'
        });

    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }
};

