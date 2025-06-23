const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Helper to map database columns to frontend setting keys
const mapDbToFrontend = (dbSettings) => {
    if (!dbSettings) return {};
    return {
        site_name: dbSettings.storeName,
        vat_rate: dbSettings.taxRate,
        currency: dbSettings.currency,
        contact_email: dbSettings.contactEmail,
        contact_phone: dbSettings.contactPhone,
    };
};

// Get all settings
router.get('/', async (req, res) => {
    try {
        // Assuming there is only one row in the settings table
        const [rows] = await db.query('SELECT * FROM settings LIMIT 1');
        if (rows.length === 0) {
            return res.json({}); // No settings found, return empty object
        }
        res.json(mapDbToFrontend(rows[0]));
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ message: 'Database error while fetching settings' });
    }
});

// Update settings
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
    const frontendSettings = req.body;
    
    // Map frontend keys to DB columns
    const dbUpdate = {};
    if (frontendSettings.site_name !== undefined) dbUpdate.storeName = frontendSettings.site_name;
    if (frontendSettings.vat_rate !== undefined) dbUpdate.taxRate = frontendSettings.vat_rate;
    if (frontendSettings.currency !== undefined) dbUpdate.currency = frontendSettings.currency;
    if (frontendSettings.contact_email !== undefined) dbUpdate.contactEmail = frontendSettings.contact_email;
    if (frontendSettings.contact_phone !== undefined) dbUpdate.contactPhone = frontendSettings.contact_phone;

    const fieldsToUpdate = Object.keys(dbUpdate);
    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No valid settings provided for update.' });
    }

    const setClauses = fieldsToUpdate.map(key => `${key} = ?`).join(', ');
    const values = fieldsToUpdate.map(key => dbUpdate[key]);

    try {
        // This assumes a single row of settings in the table to be updated.
        const sql = `UPDATE settings SET ${setClauses}`;
        const [result] = await db.query(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Settings could not be updated as no settings row was found.' });
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ message: 'Database error while updating settings', details: err.message });
    }
});

// Get available currencies
router.get('/currencies', (req, res) => {
    const currencies = {
        'USD': { name: 'United States Dollar', symbol: '$' },
        'EUR': { name: 'Euro', symbol: '€' },
        'GBP': { name: 'British Pound Sterling', symbol: '£' },
        'ILS': { name: 'Israeli New Sheqel', symbol: '₪' }
    };
    res.json(currencies);
});

module.exports = router; 