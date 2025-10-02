const dbSingleton = require('../../dbSingleton.js');

const db = dbSingleton.getConnection();

// Get all suppliers (public) - shows only active suppliers
exports.getPublicSuppliers = async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT supplier_id, name FROM suppliers WHERE isActive = TRUE ORDER BY name');
        res.json(suppliers);
    } catch (err) {
        console.error("Error fetching public suppliers:", err);
        res.status(500).json({ message: "Database error" });
    }
};

// Get all suppliers (admin only) - shows both active and inactive
exports.getAllSuppliers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        
        let whereClause = '';
        let params = [];
        
        // Add search functionality if search parameter is provided
        if (search && search.trim()) {
            whereClause = 'WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?)';
            const searchTerm = `%${search.trim()}%`;
            params = [searchTerm, searchTerm, searchTerm, searchTerm];
        }
        
        // Get total count for pagination
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total FROM suppliers ${whereClause}
        `, params);
        
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / parseInt(limit));
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get paginated suppliers
        const [suppliers] = await db.query(`
            SELECT 
                supplier_id, 
                name, 
                email, 
                phone, 
                contact, 
                address, 
                isActive, 
                CASE WHEN isActive = 1 THEN "Active" ELSE "Inactive" END as status 
            FROM suppliers 
            ${whereClause}
            ORDER BY isActive DESC, name
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        res.json({
            suppliers,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPreviousPage: parseInt(page) > 1
            }
        });
    } catch (err) {
        console.error("Error fetching suppliers:", err);
        res.status(500).json({ message: "Database error" });
    }
};

// Add a new supplier
exports.createSupplier = async (req, res) => {
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
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A supplier with this name already exists.' });
        }
        console.error("Error adding supplier:", err);
        res.status(500).json({ message: "Database error" });
    }
};

// Update a supplier
exports.updateSupplier = async (req, res) => {
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
};

// Soft delete a supplier (set isActive to false)
exports.deleteSupplier = async (req, res) => {
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
};

// Restore a deactivated supplier (set isActive to true)
exports.restoreSupplier = async (req, res) => {
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
};
