const dbSingleton = require('../../dbSingleton.js');

const db = dbSingleton.getConnection();

// Get all categories (public)
exports.getPublicCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories WHERE isActive = TRUE ORDER BY name');
        res.json(categories);
    } catch (err) {
        console.error('Database error in GET /categories/public:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Get all categories (admin only) - shows both active and inactive
exports.getAllCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        
        let whereClause = '';
        let params = [];
        
        // Add search functionality if search parameter is provided
        if (search && search.trim()) {
            whereClause = 'WHERE (name LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search.trim()}%`;
            params = [searchTerm, searchTerm];
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
            ORDER BY name
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
