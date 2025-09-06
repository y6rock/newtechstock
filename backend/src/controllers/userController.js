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
    
    const sql = `UPDATE users SET name = ?, phone = ?, city = ?, profile_image = ? WHERE user_id = ?`;
    try {
        const [result] = await db.query(sql, [name, phone, city, profile_image, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // Generate new JWT token with updated name
        const newToken = jwt.sign(
            { 
                user_id: req.user.user_id, 
                email: req.user.email, 
                role: req.user.role,
                name: name
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
