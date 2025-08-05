const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get all suppliers
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT supplier_id, name, contact FROM suppliers ORDER BY name');
        res.json(suppliers);
    } catch (err) {
        console.error("Error fetching suppliers:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Add a new supplier
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { name, contact } = req.body;
    
    if (!name || !contact) {
        return res.status(400).json({ message: 'Supplier name and contact are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO suppliers (name, contact) VALUES (?, ?)',
            [name, contact]
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
    const { name, contact } = req.body;
    
    if (!name || !contact) {
        return res.status(400).json({ message: 'Supplier name and contact are required' });
    }

    try {
        const [result] = await db.query(
            'UPDATE suppliers SET name = ?, contact = ? WHERE supplier_id = ?',
            [name, contact, id]
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

// Delete a supplier
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Check if supplier is being used by any products
        const [products] = await db.query(
            'SELECT COUNT(*) as count FROM products WHERE supplier_id = ?',
            [id]
        );
        
        if (products[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete supplier. It is currently being used by products.' 
            });
        }

        const [result] = await db.query(
            'DELETE FROM suppliers WHERE supplier_id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ message: 'Supplier deleted successfully' });
    } catch (err) {
        console.error("Error deleting supplier:", err);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router; 