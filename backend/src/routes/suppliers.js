const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get all suppliers
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT supplier_id, name FROM suppliers ORDER BY name');
        res.json(suppliers);
    } catch (err) {
        console.error("Error fetching suppliers:", err);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router; 