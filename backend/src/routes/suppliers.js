const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get all suppliers (public) - shows only active suppliers
router.get('/public', async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT supplier_id, name FROM suppliers WHERE isActive = TRUE ORDER BY name');
        res.json(suppliers);
    } catch (err) {
        console.error("Error fetching public suppliers:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get all suppliers (admin only) - shows both active and inactive
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT supplier_id, name, email, phone, contact, address, CASE WHEN isActive = 1 THEN "Active" ELSE "Inactive" END as status FROM suppliers ORDER BY name');
        res.json(suppliers);
    } catch (err) {
        console.error("Error fetching suppliers:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Add a new supplier
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { name, email, phone, address } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Supplier name is required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO suppliers (name, email, phone, address) VALUES (?, ?, ?, ?)',
            [name, email || null, phone || null, address || null]
        );
        res.status(201).json({ 
            message: 'Supplier added successfully',
            supplier_id: result.insertId 
        });
    } catch (err) {
        console.error("Error adding supplier:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Update a supplier
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Supplier name is required' });
    }

    try {
        const [result] = await db.query(
            'UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ? WHERE supplier_id = ?',
            [name, email || null, phone || null, address || null, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ message: 'Supplier updated successfully' });
    } catch (err) {
        console.error("Error updating supplier:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Soft delete a supplier (set isActive to false)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            'UPDATE suppliers SET isActive = FALSE WHERE supplier_id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ message: 'Supplier deactivated successfully' });
    } catch (err) {
        console.error("Error deactivating supplier:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Restore a deactivated supplier (set isActive to true)
router.patch('/:id/restore', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(
            'UPDATE suppliers SET isActive = TRUE WHERE supplier_id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ message: 'Supplier restored successfully' });
    } catch (err) {
        console.error("Error restoring supplier:", err);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router; 