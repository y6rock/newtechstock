const dbSingleton = require('../../dbSingleton.js');

const db = dbSingleton.getConnection();

// Get all suppliers (public) - returns only active suppliers
exports.getPublicSuppliers = async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT supplier_id, name, isActive FROM suppliers WHERE isActive = 1 ORDER BY name');
        res.json(suppliers);
    } catch (err) {
        console.error("Error fetching public suppliers:", err);
        res.status(500).json({ message: "Database error" });
    }
};

// Get all suppliers (admin only) - shows both active and inactive
exports.getAllSuppliers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status, sortField = 'supplier_id', sortDirection = 'desc' } = req.query;
        
        let whereConditions = [];
        let params = [];
        
        // Add search functionality if search parameter is provided
        if (search && search.trim()) {
            whereConditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Add status filter if provided
        if (status && status !== 'all') {
            if (status === 'active') {
                whereConditions.push('isActive = 1');
            } else if (status === 'inactive') {
                whereConditions.push('isActive = 0');
            }
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Sorting whitelist/mapping (case-insensitive)
        const allowedSortFields = {
            'supplier_id': 'supplier_id',
            'supplierid': 'supplier_id',
            'name': 'name',
            'email': 'email',
            'phone': 'phone',
            'address': 'address',
            'status': 'isActive',
            'isactive': 'isActive',
            'is_active': 'isActive'
        };
        const normalizedField = String(sortField || '').toLowerCase();
        const column = allowedSortFields[normalizedField] || 'supplier_id';
        const dir = String(sortDirection || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        
        console.log('Sort params received:', { sortField, normalizedField, column, dir });

        let orderByClause;
        if (column === 'isActive') {
            orderByClause = dir === 'ASC'
                ? 'ORDER BY isActive DESC, name ASC'  // Active first
                : 'ORDER BY isActive ASC, name ASC';  // Inactive first
        } else {
            orderByClause = `ORDER BY ${column} ${dir}`;
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
            ${orderByClause}
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

// Get supplier statistics (global counts)
exports.getSupplierStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_suppliers,
                SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active_suppliers,
                SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) as inactive_suppliers
            FROM suppliers
        `);
        
        res.json({
            totalSuppliers: stats[0].total_suppliers || 0,
            activeSuppliers: stats[0].active_suppliers || 0,
            inactiveSuppliers: stats[0].inactive_suppliers || 0
        });
    } catch (err) {
        console.error('Error fetching supplier statistics:', err);
        res.status(500).json({ message: 'Database error' });
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
        // Check if supplier has any active products
        const [productsCheck] = await db.query(
            'SELECT COUNT(*) as product_count FROM products WHERE supplier_id = ? AND is_active = 1',
            [id]
        );
        
        if (productsCheck[0].product_count > 0) {
            return res.status(400).json({ 
                message: 'Cannot deactivate supplier with active products. Please deactivate all products first.' 
            });
        }
        
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
