const dbSingleton = require('../../dbSingleton.js');
const jwt = require('jsonwebtoken');

const db = dbSingleton.getConnection();

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
    const { id } = req.params;
    // Basic security check: a user can only request their own profile
    if (req.user.user_id.toString() !== id) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own profile.' });
    }

    const sql = `SELECT user_id, email, name, phone, city, role, profile_image FROM users WHERE user_id = ?`;
    try {
        const [rows] = await db.query(sql, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Database error', details: err.message });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    const { id } = req.params;
    const { name, phone, city, profile_image } = req.body;
    
    // Basic security check: a user can only update their own profile
    if (req.user.user_id.toString() !== id) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }
    
    // Server-side validation
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name is required' });
    }
    
    // Name length validation
    if (name.length > 70) {
        return res.status(400).json({ message: 'Name must be 70 characters or less' });
    }
    
    // Enhanced phone validation (optional but if provided, must be valid)
    if (phone && phone.trim()) {
        // Remove all non-digit characters for validation
        const phoneDigits = phone.replace(/\D/g, '');
        
        // Check if phone has valid length
        if (phoneDigits.length < 7 || phoneDigits.length > 15) {
            return res.status(400).json({ message: 'Phone number must be between 7 and 15 digits. Examples: +1234567890, (123) 456-7890, 123-456-7890' });
        }
        
        // Check for common invalid patterns
        if (phoneDigits.length === phoneDigits.split('').filter(d => d === phoneDigits[0]).length) {
            return res.status(400).json({ message: 'Phone number cannot be all the same digit' });
        }
        
        // Check for sequential numbers (like 1234567890)
        const isSequential = phoneDigits.split('').every((digit, index) => {
            if (index === 0) return true;
            const currentDigit = parseInt(digit);
            const prevDigit = parseInt(phoneDigits[index - 1]);
            return currentDigit === (prevDigit + 1) % 10; // Handle wrap-around (9 -> 0)
        });
        
        if (isSequential && phoneDigits.length >= 8) {
            return res.status(400).json({ message: 'Phone number cannot be sequential numbers' });
        }
    }
    
    // City validation (optional but if provided, must not be too long)
    if (city && city.length > 100) {
        return res.status(400).json({ message: 'City must be 100 characters or less' });
    }
    
    const sql = `UPDATE users SET name = ?, phone = ?, city = ?, profile_image = ? WHERE user_id = ?`;
    try {
        const [result] = await db.query(sql, [name.trim(), phone?.trim() || null, city?.trim() || null, profile_image, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // Generate new JWT token with updated name
        const newToken = jwt.sign(
            { 
                user_id: req.user.user_id, 
                email: req.user.email, 
                role: req.user.role,
                name: name.trim()
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({ 
            message: 'Profile updated successfully',
            token: newToken
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Database error', details: err.message });
    }
};
