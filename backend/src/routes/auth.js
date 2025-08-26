const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken } = require('../middleware/auth.js');
const multer = require('multer');
const path = require('path');
const loginLimiter = require('../../utils/loginLimiter.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this 'uploads' directory exists in the backend root
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// POST route for uploading an image
router.post('/upload-image', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file.' });
    }
    const imageUrl = `/${req.file.path.replace(/\\/g, '/')}`;
    res.status(200).json({ imageUrl: imageUrl });
});

// ✅ API - הרשמה
router.post('/register', async (req, res) => {
  const { email, password, name, phone, city } = req.body;
  
  // Server-side validation
  if (!email || !password || !name || !phone || !city) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Trim whitespace and check for empty strings
  if (!email.trim() || !password.trim() || !name.trim() || !phone.trim() || !city.trim()) {
    return res.status(400).json({ message: 'All fields must not be empty' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  
  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO users (email, password, name, phone, city) VALUES (?, ?, ?, ?, ?)`;
  try {
    await db.query(sql, [email.trim(), hashedPassword, name.trim(), phone.trim(), city.trim()]);
    
    // Set VAT rate to 18% for new user signups
    const updateVatSql = `UPDATE settings SET taxRate = 18.00 WHERE id = 1`;
    await db.query(updateVatSql);
    
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('Database error during registration:', err);
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
});

// ✅ API - התחברות
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM users WHERE email = ?`;

  try {
    console.log(`Login attempt for email: ${email}`);

    // Check if user is blocked
    if (loginLimiter.isBlocked(email)) {
      const remainingTime = loginLimiter.getRemainingBlockTime(email);
      return res.status(429).json({ 
        message: `Too many failed attempts. Please try again in ${remainingTime} seconds.`,
        remainingTime: remainingTime
      });
    }

    const [results] = await db.query(sql, [email]);

    if (results.length === 0) {
      loginLimiter.recordFailedAttempt(email);
      const remainingAttempts = loginLimiter.getRemainingAttempts(email);
      console.log(`Login failed: Invalid email or password for ${email}. Remaining attempts: ${remainingAttempts}`);
      
      if (remainingAttempts === 0) {
        return res.status(429).json({ 
          message: `Too many failed attempts. Please try again in 60 seconds.`,
          remainingTime: 60
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid email or password',
        remainingAttempts: remainingAttempts
      });
    }

    const user = results[0];
    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      loginLimiter.recordFailedAttempt(email);
      const remainingAttempts = loginLimiter.getRemainingAttempts(email);
      console.log(`Login failed: Invalid password for ${email}. Remaining attempts: ${remainingAttempts}`);
      
      if (remainingAttempts === 0) {
        return res.status(429).json({ 
          message: `Too many failed attempts. Please try again in 60 seconds.`,
          remainingTime: 60
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid email or password',
        remainingAttempts: remainingAttempts
      });
    }

    // Successful login - reset failed attempts
    loginLimiter.recordSuccessfulAttempt(email);

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, username: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );
    console.log(`Login successful for user: ${user.name}`);
    res.json({ message: 'Login successful', token, role: user.role });
  } catch (err) {
    console.error('Login database error:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];

        // Create a reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await db.query('UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE user_id = ?', [resetToken, resetPasswordExpires, user.user_id]);

        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Password reset email will not be sent.');
            return res.status(200).json({ 
                message: 'Password reset token generated. Email service not configured.',
                resetToken: resetToken,
                resetUrl: `http://localhost:3000/reset-password/${resetToken}`
            });
        }

        // Send the email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER, // Use the actual Gmail address
            subject: 'TechStock Password Reset',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">TechStock Password Reset</h2>
                    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                    <p>Please click on the following link to complete the process:</p>
                    <p style="text-align: center;">
                        <a href="http://localhost:3000/reset-password/${resetToken}" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p>Or copy and paste this URL into your browser:</p>
                    <p style="background-color: #f8f9fa; padding: 10px; border-radius: 3px; word-break: break-all;">
                        http://localhost:3000/reset-password/${resetToken}
                    </p>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <p>This link will expire in 1 hour.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Password reset email sent to ${user.email}`);
            res.status(200).json({ message: 'Password reset email sent successfully' });
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            console.error('Email error details:', {
                code: emailError.code,
                command: emailError.command,
                response: emailError.response,
                responseCode: emailError.responseCode
            });
            
            // Return the reset token and URL so user can still reset password
            res.status(200).json({ 
                message: 'Password reset token generated but email failed to send. You can use the reset link below.',
                resetToken: resetToken,
                resetUrl: `http://localhost:3000/reset-password/${resetToken}`,
                emailError: emailError.message
            });
        }

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > ?', [token, Date.now()]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        const user = users[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query('UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE user_id = ?', [hashedPassword, user.user_id]);

        res.status(200).json({ message: "Password has been reset successfully." });
    } catch (err) {
        console.error('Error during password reset:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 