const dbSingleton = require('../../dbSingleton.js');

const db = dbSingleton.getConnection();

// Get all categories (public) - returns only active categories by default, or all if includeInactive=true
exports.getPublicCategories = async (req, res) => {
    try {
        const { includeInactive } = req.query;
        let query;
        
        if (includeInactive === 'true') {
            // Return all categories (active and inactive) for filtering purposes
            query = 'SELECT *, isActive FROM categories ORDER BY isActive DESC, name';
        } else {
            // Return only active categories for display (default)
            query = 'SELECT *, isActive FROM categories WHERE isActive = TRUE ORDER BY name';
        }
        
        const [categories] = await db.query(query);
        res.json(categories);
    } catch (err) {
        console.error('Database error in GET /categories/public:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Get all categories (admin only) - shows both active and inactive
exports.getAllCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status, sortField = 'category_id', sortDirection = 'desc' } = req.query;
        
        let whereConditions = [];
        let params = [];
        
        // Add search functionality if search parameter is provided
        if (search && search.trim()) {
            whereConditions.push('(name LIKE ? OR description LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm);
        }
        
        // Add status filter if provided
        if (status && status !== 'all') {
            if (status === 'active') {
                whereConditions.push('isActive = TRUE');
            } else if (status === 'inactive') {
                whereConditions.push('isActive = FALSE');
            }
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Sorting: whitelist and map UI fields to DB columns
        const allowedSortFields = {
            name: 'name',
            category_id: 'category_id',
            status: 'isActive'
        };
        const normalizedField = String(sortField || '').toLowerCase();
        const column = allowedSortFields[normalizedField] || 'name';
        const dir = String(sortDirection || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

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
            SELECT COUNT(*) as total FROM categories ${whereClause}
        `, params);
        
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / parseInt(limit));
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get paginated categories
        const [categories] = await db.query(`
            SELECT 
                *, 
                CASE WHEN isActive = TRUE THEN "Active" ELSE "Inactive" END as status 
            FROM categories 
            ${whereClause}
            ${orderByClause}
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        res.json({
            categories,
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
        console.error('Database error in GET /categories:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Get categories by multiple IDs (public)
exports.getCategoriesByIds = async (req, res) => {
    const { ids } = req.query;
    if (!ids) {
        return res.status(400).json({ message: 'Category IDs are required.' });
    }

    try {
        const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (idArray.length === 0) {
            return res.status(400).json({ message: 'Valid category IDs are required.' });
        }

        const placeholders = idArray.map(() => '?').join(',');
        const [categories] = await db.query(`
            SELECT category_id, name, image, description
            FROM categories
            WHERE category_id IN (${placeholders})
            ORDER BY FIELD(category_id, ${placeholders})
        `, [...idArray, ...idArray]);

        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories by IDs:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    const { name, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || null;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Category name cannot be empty.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO categories (name, image, description) VALUES (?, ?, ?)', 
            [name.trim(), image, description || null]
        );
        res.status(201).json({ 
            message: 'Category added successfully', 
            category_id: result.insertId 
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A category with this name already exists.' });
        }
        console.error('Error adding category:', err);
        res.status(500).json({ message: 'Failed to add category due to a server error.' });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    let image = req.body.image;
    
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
    }
    
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Category name cannot be empty.' });
    }
    
    try {
        const [result] = await db.query(
            'UPDATE categories SET name = ?, image = ?, description = ? WHERE category_id = ?', 
            [name.trim(), image, description || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A category with this name already exists.' });
        }
        console.error(`Error updating category ${id}:`, err);
        res.status(500).json({ message: 'Failed to update category due to a server error.' });
    }
};

// Soft delete a category (set isActive to false)
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if category has any active products
        const [productsCheck] = await db.query(
            'SELECT COUNT(*) as product_count FROM products WHERE category_id = ? AND is_active = 1',
            [id]
        );
        
        if (productsCheck[0].product_count > 0) {
            return res.status(400).json({ 
                message: 'Cannot deactivate category with active products. Please deactivate all products first.' 
            });
        }
        
        const [result] = await db.query('UPDATE categories SET isActive = FALSE WHERE category_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category deactivated successfully' });
    } catch (err) {
        console.error(`Error deactivating category ${id}:`, err);
        res.status(500).json({ message: 'Failed to deactivate category due to a server error.' });
    }
};

// Restore a deactivated category (set isActive to true)
exports.restoreCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('UPDATE categories SET isActive = TRUE WHERE category_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category restored successfully' });
    } catch (err) {
        console.error(`Error restoring category ${id}:`, err);
        res.status(500).json({ message: 'Failed to restore category due to a server error.' });
    }
};

// Toggle category status (active/inactive)
exports.toggleCategoryStatus = async (req, res) => {
    const { id } = req.params;
    try {
        // First get the current status
        const [current] = await db.query('SELECT isActive FROM categories WHERE category_id = ?', [id]);
        if (current.length === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        
        const newStatus = !current[0].isActive;
        
        // If deactivating, check if category has any active products
        if (!newStatus) {
            const [productsCheck] = await db.query(
                'SELECT COUNT(*) as product_count FROM products WHERE category_id = ? AND is_active = 1',
                [id]
            );
            
            if (productsCheck[0].product_count > 0) {
                return res.status(400).json({ 
                    message: 'Cannot deactivate category with active products. Please deactivate all products first.' 
                });
            }
        }
        
        const [result] = await db.query('UPDATE categories SET isActive = ? WHERE category_id = ?', [newStatus, id]);
        
        res.json({ 
            message: `Category ${newStatus ? 'activated' : 'deactivated'} successfully`,
            isActive: newStatus
        });
    } catch (err) {
        console.error(`Error toggling category status ${id}:`, err);
        res.status(500).json({ message: 'Failed to toggle category status due to a server error.' });
    }
};
