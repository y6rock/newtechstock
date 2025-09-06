const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dbSingleton = require('../../dbSingleton.js');
const multer = require('multer');
const path = require('path');
const loginLimiter = require('../../utils/loginLimiter.js');
const EmailService = require('../../utils/emailService.js');

const db = dbSingleton.getConnection();

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload image
exports.uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file.' });
    }
    const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    res.status(200).json({ imageUrl: imageUrl });
};

// Register user
exports.register = async (req, res) => {
    const { email, password, name, phone, city } = req.body;
    
    // Server-side validation
    if (!email || !password || !name || !phone || !city) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Trim whitespace and check for empty strings
    if (!email.trim() || !password.trim() || !name.trim() || !phone.trim() || !city.trim()) {
        return res.status(400).json({ message: 'All fields must not be empty' });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    // Password strength validation
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    try {
        // Check if user already exists
        const [existingUsers] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user into database
        const [result] = await db.query(
            'INSERT INTO users (email, password, name, phone, city, role) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, name, phone, city, 'user']
        );
        
        res.status(201).json({ 
            message: 'User registered successfully',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    try {
        // Check if user exists
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Account is deactivated. Please contact support.' });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                email: user.email, 
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, email, name, phone, city, role, profile_image FROM users WHERE user_id = ?',
            [req.user.user_id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    const { name, phone, city, profile_image } = req.body;
    
    try {
        const [result] = await db.query(
            'UPDATE users SET name = ?, phone = ?, city = ?, profile_image = ? WHERE user_id = ?',
            [name, phone, city, profile_image, req.user.user_id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    try {
        // Get current user
        const [users] = await db.query('SELECT password FROM users WHERE user_id = ?', [req.user.user_id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedNewPassword, req.user.user_id]);
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Forgot password request for email:', email);
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const [users] = await db.query('SELECT user_id, name FROM users WHERE email = ?', [email]);
        console.log('User query result:', users);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
        
        console.log('Generated reset token:', resetToken);
        console.log('Token expiry timestamp:', resetTokenExpiry);
        
        // Store reset token in database
        await db.query(
            'UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE user_id = ?',
            [resetToken, resetTokenExpiry, user.user_id]
        );
        
        console.log('Reset token stored in database');
        
        // Send reset email using existing EmailService
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        const emailService = new EmailService();
        const emailSent = await emailService.sendPasswordResetEmail(email, user.name, resetUrl);
        
        if (emailSent) {
            console.log('Password reset email sent successfully to:', email);
            res.json({ message: 'Password reset email sent successfully' });
        } else {
            console.log('Email service not configured or failed. Password reset token:', resetToken);
            res.json({ 
                message: 'Password reset token generated, but email could not be sent. Please contact support.',
                resetToken: resetToken, // For development/fallback
                resetUrl: resetUrl
            });
        }
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    try {
        const [users] = await db.query(
            'SELECT user_id FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > ?',
            [token, Date.now()]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db.query(
            'UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE user_id = ?',
            [hashedPassword, users[0].user_id]
        );
        
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Export multer for use in routes
exports.upload = upload;
