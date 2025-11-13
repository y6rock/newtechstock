const dbSingleton = require('../../dbSingleton.js');
const { isValidPrice, isValidStock } = require('../../utils/validation.js');

const db = dbSingleton.getConnection();

// Get all products (public) - only active products with optional filtering
exports.getAllProducts = async (req, res) => {
    try {
        const { 
            category, 
            minPrice, 
            maxPrice, 
            manufacturer, 
            search,
            page = 1,
            limit = 50
        } = req.query;
        
        let whereConditions = [
            'p.is_active = 1',
            '(c.isActive = 1 OR c.isActive IS NULL)', // Only active categories
            '(s.isActive = 1 OR s.isActive IS NULL)'  // Only active suppliers
        ];
        let params = [];
        
        // Category filter
        if (category && category !== 'All Products') {
            whereConditions.push('c.name = ?');
            params.push(category);
        }
        
        // Price range filter
        if (minPrice !== undefined && minPrice !== null && minPrice !== '' && !isNaN(parseFloat(minPrice))) {
            whereConditions.push('p.price >= ?');
            params.push(parseFloat(minPrice));
        }
        
        // Allow maxPrice to be 0 (user can set slider to 0 to filter out all products)
        if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '' && !isNaN(parseFloat(maxPrice))) {
            whereConditions.push('p.price <= ?');
            params.push(parseFloat(maxPrice));
        }
        
        // Manufacturer filter (supplier)
        if (manufacturer && manufacturer.length > 0) {
            const manufacturerIds = Array.isArray(manufacturer) ? manufacturer : [manufacturer];
            const placeholders = manufacturerIds.map(() => '?').join(',');
            whereConditions.push(`p.supplier_id IN (${placeholders})`);
            params.push(...manufacturerIds.map(id => parseInt(id)));
        }
        
        // Search filter
        if (search && search.trim()) {
            whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR s.name LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Always need JOINs for category and supplier active status checks
        const joinClause = 'LEFT JOIN categories c ON p.category_id = c.category_id LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id';
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Get total count for pagination
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM products p
            ${joinClause}
            ${whereClause}
        `, params);
        
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / parseInt(limit));
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get paginated products
        const [products] = await db.query(`
            SELECT 
                p.*,
                c.name as category_name,
                s.name as supplier_name
            FROM products p
            ${joinClause}
            ${whereClause}
            ORDER BY p.name
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        res.json({
            products,
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
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Get price statistics for slider (min, max prices)
exports.getPriceStats = async (req, res) => {
    try {
        const { category, manufacturer } = req.query;
        
        let whereConditions = [
            'p.is_active = 1',
            '(c.isActive = 1 OR c.isActive IS NULL)', // Only active categories
            '(s.isActive = 1 OR s.isActive IS NULL)'  // Only active suppliers
        ];
        let params = [];
        
        // Add category filter if provided (using category name like getAllProducts)
        if (category && category !== 'All Products') {
            whereConditions.push('c.name = ?');
            params.push(category);
        }
        
        // Add manufacturer (supplier) filter if provided
        if (manufacturer) {
            const manufacturerIds = Array.isArray(manufacturer) ? manufacturer : [manufacturer];
            if (manufacturerIds.length > 0) {
                const placeholders = manufacturerIds.map(() => '?').join(',');
                whereConditions.push(`p.supplier_id IN (${placeholders})`);
                params.push(...manufacturerIds.map(id => parseInt(id)));
            }
        }
        
        // Always need JOINs for category and supplier active status checks (same as getAllProducts)
        const joinClause = 'LEFT JOIN categories c ON p.category_id = c.category_id LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id';
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const sql = `SELECT MIN(p.price) as minPrice, MAX(p.price) as maxPrice FROM products p ${joinClause} ${whereClause}`;
        console.log('getPriceStats SQL:', sql);
        console.log('getPriceStats params:', params);
        const [stats] = await db.query(sql, params);
        
        const minPrice = parseFloat(stats[0].minPrice);
        const maxPrice = parseFloat(stats[0].maxPrice);
        
        console.log('getPriceStats result:', { minPrice, maxPrice, category, manufacturer });
        
        // If no products found with filters, fallback to all products stats (only active categories/suppliers)
        if (!minPrice && !maxPrice) {
            const fallbackSql = `SELECT MIN(p.price) as minPrice, MAX(p.price) as maxPrice 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
                WHERE p.is_active = 1 
                AND (c.isActive = 1 OR c.isActive IS NULL)
                AND (s.isActive = 1 OR s.isActive IS NULL)`;
            const [fallbackStats] = await db.query(fallbackSql);
            res.json({
                minPrice: parseFloat(fallbackStats[0].minPrice) || 0,
                maxPrice: parseFloat(fallbackStats[0].maxPrice) || 1000
            });
        } else {
            res.json({
                minPrice: minPrice || 0,
                maxPrice: maxPrice || 1000
            });
        }
    } catch (err) {
        console.error('Error fetching price statistics:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Search products (public) - returns name, image, price for dropdown
exports.searchProducts = async (req, res) => {
    const { q: query } = req.query;
    
    if (!query || query.trim().length === 0) {
        return res.json([]);
    }

    try {
        const searchTerm = `%${query.trim()}%`;
        const [products] = await db.query(`
            SELECT 
                p.product_id,
                p.name,
                p.price,
                p.image,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            WHERE p.is_active = 1 
            AND (c.isActive = 1 OR c.isActive IS NULL)
            AND (s.isActive = 1 OR s.isActive IS NULL)
            AND (
                p.name LIKE ? 
                OR p.description LIKE ?
                OR c.name LIKE ?
            )
            ORDER BY 
                CASE 
                    WHEN p.name LIKE ? THEN 1
                    WHEN p.description LIKE ? THEN 2
                    WHEN c.name LIKE ? THEN 3
                    ELSE 4
                END,
                p.name
            LIMIT 8
        `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
        
        res.json(products);
    } catch (err) {
        console.error('Error searching products:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Get a single product by ID (public) - only active products
exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const [products] = await db.query(`
            SELECT 
                p.*,
                c.name as category_name,
                s.name as supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            WHERE p.product_id = ? 
            AND p.is_active = 1
            AND (c.isActive = 1 OR c.isActive IS NULL)
            AND (s.isActive = 1 OR s.isActive IS NULL)
        `, [id]);
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(products[0]);
    } catch (err) {
        console.error(`Error fetching product ${id}:`, err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Get products by multiple IDs (public) - only active products
exports.getProductsByIds = async (req, res) => {
    const { ids } = req.query;
    if (!ids) {
        return res.status(400).json({ message: 'Product IDs are required.' });
    }

    try {
        const idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (idArray.length === 0) {
            return res.status(400).json({ message: 'Valid product IDs are required.' });
        }

        const placeholders = idArray.map(() => '?').join(',');
        const [products] = await db.query(`
            SELECT p.product_id, p.name, p.price, p.image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            WHERE p.product_id IN (${placeholders}) 
            AND p.is_active = 1
            AND (c.isActive = 1 OR c.isActive IS NULL)
            AND (s.isActive = 1 OR s.isActive IS NULL)
            ORDER BY FIELD(p.product_id, ${placeholders})
        `, [...idArray, ...idArray]);

        res.json(products);
    } catch (err) {
        console.error('Error fetching products by IDs:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Create a new product (admin only)
exports.createProduct = async (req, res) => {
    const { name, description, price, stock, supplier_id, category_id } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    if (!name || !price || !stock || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isValidPrice(price)) {
        return res.status(400).json({ message: 'Invalid price value' });
    }
    if (!isValidStock(stock)) {
        return res.status(400).json({ message: 'Invalid stock value' });
    }

    try {
        const [existingProducts] = await db.query('SELECT product_id FROM products WHERE name = ?', [name]);
        if (existingProducts.length > 0) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        const sql = `INSERT INTO products (name, description, price, stock, image, supplier_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [name, description, price, stock, image, supplier_id, category_id]);
        res.json({ message: 'Product added successfully' });
    } catch (err) {
        console.error('Database error adding product:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
    }
};

// Update a product (admin only)
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, supplier_id, category_id } = req.body;
    let image = req.body.image;
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
    }

    if (!name || !price || !stock || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isValidPrice(price)) {
        return res.status(400).json({ message: 'Invalid price value' });
    }
    if (!isValidStock(stock)) {
        return res.status(400).json({ message: 'Invalid stock value' });
    }

    try {
        const [existingProducts] = await db.query('SELECT product_id FROM products WHERE name = ? AND product_id != ?', [name, id]);
        if (existingProducts.length > 0) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        const sql = `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = ?, supplier_id = ?, category_id = ? WHERE product_id = ?`;
        const [result] = await db.query(sql, [name, description, price, stock, image, supplier_id, category_id, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
};

// Soft delete a product (admin only)
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    const sql = `UPDATE products SET is_active = 0 WHERE product_id = ?`;
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.json({ message: 'Product deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
};

// Get all products including inactive (admin only)
exports.getAllProductsAdmin = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '',
            category,
            supplier,
            status,
            sortField = 'product_id',
            sortDirection = 'desc'
        } = req.query;
        
        let whereConditions = [];
        let params = [];
        
        // Add search functionality if search parameter is provided
        if (search && search.trim()) {
            whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR s.name LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        
        // Add category filter
        if (category && category !== 'all') {
            whereConditions.push('p.category_id = ?');
            params.push(parseInt(category));
        }
        
        // Add supplier filter
        if (supplier && supplier !== 'all') {
            whereConditions.push('p.supplier_id = ?');
            params.push(parseInt(supplier));
        }
        
        // Add status filter
        if (status && status !== 'all') {
            if (status === 'active') {
                whereConditions.push('p.is_active = 1');
            } else if (status === 'inactive') {
                whereConditions.push('p.is_active = 0');
            }
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Sorting: validate and map allowed fields to SQL columns
        const allowedSortFields = {
            name: 'p.name',
            price: 'p.price',
            stock: 'p.stock',
            status: 'p.is_active',
            created_at: 'p.created_at',
            updated_at: 'p.updated_at',
            category_name: 'c.name',
            supplier_name: 's.name',
            product_id: 'p.product_id'
        };
        const normalizedField = String(sortField || '').toLowerCase();
        const orderByColumn = allowedSortFields[normalizedField] || 'p.name';
        const direction = String(sortDirection || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        
        console.log('Sort params received:', { sortField, normalizedField, orderByColumn, direction });
        
        // Get total count for pagination
        const [countResult] = await db.query(`
            SELECT COUNT(*) as total
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            ${whereClause}
        `, params);
        
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / parseInt(limit));
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get paginated products
        // Build ORDER BY clause; for status, add stable secondary sort by name
        let orderByClause;
        if (orderByColumn === 'p.is_active') {
            // For status sorting, group strictly by status, then by name for stability.
            // is_active: 1 = Active, 0 = Inactive
            // ASC direction: Active (1) first, then Inactive (0) - use DESC to put 1 before 0
            // DESC direction: Inactive (0) first, then Active (1) - use ASC to put 0 before 1
            if (direction === 'ASC') {
                // Active first: ORDER BY is_active DESC puts 1 (Active) before 0 (Inactive)
                orderByClause = 'ORDER BY p.is_active DESC, p.name ASC';
            } else {
                // Inactive first: ORDER BY is_active ASC puts 0 (Inactive) before 1 (Active)
                orderByClause = 'ORDER BY p.is_active ASC, p.name ASC';
            }
            console.log('Status sorting applied:', { direction, orderByClause, sortField, normalizedField });
        } else {
            orderByClause = `ORDER BY ${orderByColumn} ${direction}`;
        }
        
        console.log('Final SQL ORDER BY clause:', orderByClause);
        console.log('Query params:', { page, limit, offset, whereClause, orderByClause });

        const [products] = await db.query(`
            SELECT 
                p.*,
                c.name as category_name,
                s.name as supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            ${whereClause}
            ${orderByClause}
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        const response = {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPreviousPage: parseInt(page) > 1
            }
        };
        
        console.log('Products admin API response:', {
            productsCount: products.length,
            pagination: response.pagination,
            queryParams: { page, limit, search, category, supplier, status, sortField: normalizedField, sortDirection: direction }
        });
        
        res.json(response);
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).json({ message: 'Database error' });
    }
};

// Restore a deactivated product (admin only)
exports.restoreProduct = async (req, res) => {
    const { id } = req.params;
    const sql = `UPDATE products SET is_active = 1 WHERE product_id = ?`;
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.json({ message: 'Product restored successfully' });
    } catch (err) {
        console.error('Error restoring product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
};

// Get global statistics for all products (admin only)
exports.getProductStats = async (req, res) => {
    try {
        const { status, category, supplier, search } = req.query;
        
        let whereConditions = [];
        let params = [];
        
        // Add status filter if provided
        if (status && status !== 'all') {
            if (status === 'active') {
                whereConditions.push('p.is_active = 1');
            } else if (status === 'inactive') {
                whereConditions.push('p.is_active = 0');
            }
        }
        
        // Add category filter if provided
        if (category && category !== 'all') {
            whereConditions.push('p.category_id = ?');
            params.push(category);
        }
        
        // Add supplier filter if provided
        if (supplier && supplier !== 'all') {
            whereConditions.push('p.supplier_id = ?');
            params.push(supplier);
        }
        
        // Add search filter if provided
        if (search && search.trim()) {
            whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
            const searchPattern = `%${search.trim()}%`;
            params.push(searchPattern, searchPattern);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_products,
                SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_products,
                SUM(CASE WHEN p.is_active = 0 THEN 1 ELSE 0 END) as inactive_products,
                SUM(CASE WHEN p.stock <= 0 THEN 1 ELSE 0 END) as out_of_stock,
                SUM(CASE WHEN p.stock > 0 AND p.stock <= 10 THEN 1 ELSE 0 END) as low_stock,
                SUM(CASE WHEN p.stock > 10 AND p.stock <= 20 THEN 1 ELSE 0 END) as medium_stock,
                SUM(CASE WHEN p.stock > 20 THEN 1 ELSE 0 END) as high_stock
            FROM products p
            ${whereClause}
        `, params);
        
        res.json({
            totalProducts: stats[0].total_products || 0,
            activeProducts: stats[0].active_products || 0,
            inactiveProducts: stats[0].inactive_products || 0,
            outOfStock: stats[0].out_of_stock || 0,
            lowStock: stats[0].low_stock || 0,
            mediumStock: stats[0].medium_stock || 0,
            highStock: stats[0].high_stock || 0
        });
    } catch (err) {
        console.error('Error fetching product statistics:', err);
        res.status(500).json({ message: 'Database error' });
    }
};
