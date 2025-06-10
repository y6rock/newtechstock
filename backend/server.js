const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const dbSingleton = require('./dbSingleton');

// Execute a query to the database
const db = dbSingleton.getConnection();

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// פונקציית אימות טוקן
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  new Promise((resolve, reject) => {
    jwt.verify(token, 'secretKey', (err, user) => {
      if (err) {
        return reject({ status: 403, message: 'Invalid token' });
      }
      resolve(user);
    });
  })
    .then(user => {
      req.user = user;
      next();
    })
    .catch(error => {
      res.status(error.status || 500).json({ message: error.message || 'Authentication error' });
    });
};

// פונקציית בדיקת הרשאות אדמין
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin only' });
  next();
};

// ✅ API - הרשמה
app.post('/api/register', async (req, res) => {
  const { email, password, name, phone, city } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql = `INSERT INTO users (email, password, name, phone, city) VALUES (?, ?, ?, ?, ?)`;
  try {
    await db.query(sql, [email, hashedPassword, name, phone, city]);
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('Database error during registration:', err);
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
});

// ✅ API - התחברות
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM users WHERE email = ?`;

  try {
    console.log(`Login attempt for email: ${email}`);
    const [results] = await db.query(sql, [email]);

    if (results.length === 0) {
      console.log(`Login failed: Invalid email or password for ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      console.log(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, username: user.name },
      'secretKey',
      { expiresIn: '1h' },
    );
    console.log(`Login successful for user: ${user.name}`);
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login database error:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// ✅ API - קבלת פרטי משתמש לפי ID (פרופיל)
app.get('/api/profile/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const sql = `SELECT user_id, email, name, phone, city, role, profile_image FROM users WHERE user_id = ?`;
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Database error', details: err.message });
  } finally {
    if (connection) connection.release(); // Release the connection back to the pool
  }
});

// ✅ API - הוספת מוצר (admin בלבד)
app.post('/api/products', authenticateToken, async (req, res) => {
  const { name, description, price, stock, image, supplier_id, category_id } = req.body;
  console.log('Received POST /api/products request with body:', req.body);
  if (!name || !description || !price || !stock || !image) {
    console.warn('Missing required fields for product addition.', req.body);
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const sql = `INSERT INTO products (name, description, price, stock, image, supplier_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  try {
    const [result] = await db.query(sql, [name, description, price, stock, image, supplier_id || null, category_id || null]);
    console.log('Product added successfully:', result);
    res.json({ message: 'Product added successfully' });
  } catch (err) {
    console.error('Database error adding product:', err);
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
});

// Update a product (admin only)
app.put('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image, supplier_id, category_id } = req.body;
  if (!name || !description || !price || !stock || !image) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const sql = `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = ?, supplier_id = ?, category_id = ? WHERE product_id = ?`;
  try {
    const [result] = await db.query(sql, [name, description, price, stock, image, supplier_id || null, category_id || null, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Delete a product (admin only)
app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM products WHERE product_id = ?`;
  try {
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// ✅ API - קבלת כל המוצרים
app.get('/api/products', async (req, res) => {
  const sql = `SELECT * FROM products`;
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Get all suppliers
app.get('/api/suppliers', authenticateToken, requireAdmin, async (req, res) => {
  const sql = 'SELECT * FROM suppliers';
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Add a new supplier (admin only)
app.post('/api/suppliers', authenticateToken, requireAdmin, async (req, res) => {
  const { name, contact } = req.body;
  console.log('Received POST /api/suppliers request with body:', req.body);
  if (!name || !contact) {
    return res.status(400).json({ message: 'Supplier name and contact are required.' });
  }
  const sql = `INSERT INTO suppliers (name, contact) VALUES (?, ?)`;
  try {
    const [result] = await db.query(sql, [name, contact]);
    res.status(201).json({ message: 'Supplier added successfully', supplierId: result.insertId });
  } catch (err) {
    console.error('Error adding supplier:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Update a supplier (admin only)
app.put('/api/suppliers/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, contact } = req.body;
  console.log(`Received PUT /api/suppliers/${id} request with body:`, req.body);
  if (!name || !contact) {
    return res.status(400).json({ message: 'Supplier name and contact are required.' });
  }
  const sql = `UPDATE suppliers SET name = ?, contact = ? WHERE supplier_id = ?`;
  try {
    const [result] = await db.query(sql, [name, contact, id]);
    if (result.affectedRows === 0) {
      console.warn(`Supplier with ID ${id} not found for update.`);
      return res.status(404).json({ message: 'Supplier not found.' });
    }
    res.json({ message: 'Supplier updated successfully' });
  } catch (err) {
    console.error('Error updating supplier:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Delete a supplier (admin only)
app.delete('/api/suppliers/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`Received DELETE /api/suppliers/${id} request.`);
  const sql = `DELETE FROM suppliers WHERE supplier_id = ?`;
  try {
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) {
      console.warn(`Supplier with ID ${id} not found for deletion.`);
      return res.status(404).json({ message: 'Supplier not found.' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  const sql = 'SELECT * FROM categories';
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Add a new category (admin only)
app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Category name is required.' });
  }
  const sql = `INSERT INTO categories (name) VALUES (?)`;
  try {
    const [result] = await db.query(sql, [name]);
    res.status(201).json({ message: 'Category added successfully', categoryId: result.insertId });
  } catch (err) {
    console.error('Error adding category:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Update a category (admin only)
app.put('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Category name is required.' });
  }
  const sql = `UPDATE categories SET name = ? WHERE category_id = ?`;
  try {
    const [result] = await db.query(sql, [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('Error updating category:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Delete a category (admin only)
app.delete('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM categories WHERE category_id = ?`;
  try {
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// ===================== ORDER MANAGEMENT =====================

// Create a new order (user)
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { user_id, total_amount, items } = req.body;
  console.log('Received POST /api/orders request with data:', { user_id, total_amount, items });

  if (!user_id || !total_amount || !items || items.length === 0) {
    console.warn('Missing required fields for order creation.', { user_id, total_amount, items });
    return res.status(400).json({ message: 'Missing required order information.' });
  }

  let connection; // Declare connection outside try-catch to ensure it's accessible in finally
  try {
    connection = await db.getConnection(); // Get a connection from the pool
    await connection.beginTransaction(); // Start a transaction

    // 1. Insert into orders table
    const orderSql = `INSERT INTO orders (user_id, total_price, date) VALUES (?, ?, NOW())`;
    const [orderResult] = await connection.query(orderSql, [user_id, total_amount]);
    const orderId = orderResult.insertId;
    console.log(`Order ${orderId} created for user ${user_id}.`);

    // 2. Insert into orders_products table for each item
    const orderItemsSql = `INSERT INTO orders_products (order_id, product_id, quantity, price_at_order) VALUES (?, ?, ?, ?)`;
    for (const item of items) {
      await connection.query(orderItemsSql, [orderId, item.product_id, item.quantity, item.price]);
    }
    console.log(`Order items for order ${orderId} inserted.`);

    await connection.commit(); // Commit the transaction
    res.status(201).json({ message: 'Order placed successfully', orderId: orderId });

  } catch (err) {
    if (connection) {
      await connection.rollback(); // Rollback on error
      console.error('Transaction rolled back due to error.');
    }
    console.error('Error placing order:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
      console.log('Database connection released.');
    }
  }
});

// Get orders for the logged-in user
app.get('/api/orders', authenticateToken, async (req, res) => {
  const userId = req.user.user_id; // Get user ID from the token

  const sql = `
    SELECT
      o.order_id,
      o.date,
      o.total_price,
      op.quantity,
      op.price_at_order,
      p.name AS product_name,
      p.image AS product_image
    FROM orders o
    JOIN orders_products op ON o.order_id = op.order_id
    JOIN products p ON op.product_id = p.product_id
    WHERE o.user_id = ?
    ORDER BY o.date DESC;
  `;

  try {
    const [rows] = await db.query(sql, [userId]);

    // Group products by order_id
    const orders = {};
    rows.forEach(row => {
      if (!orders[row.order_id]) {
        orders[row.order_id] = {
          order_id: row.order_id,
          order_date: row.date,
          total_price: row.total_price,
          products: []
        };
      }
      orders[row.order_id].products.push({
        product_name: row.product_name,
        product_image: row.product_image,
        quantity: row.quantity,
        price_at_order: row.price_at_order
      });
    });

    res.json(Object.values(orders));
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Image upload endpoint
app.post('/api/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  // You might want to save imageUrl to the database here, e.g., to the user's profile
  // For example: await db.query('UPDATE users SET profile_image = ? WHERE user_id = ?', [imageUrl, req.user.user_id]);
  res.json({ imageUrl });
});

// Get settings
app.get('/api/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('Attempting to fetch settings...');
        const [rows] = await db.query('SELECT * FROM settings LIMIT 1');
        if (rows.length > 0) {
            console.log('Settings fetched successfully:', rows[0]);
            res.json(rows[0]);
        } else {
            console.log('No settings found, returning default.');
            res.json({}); // Return empty object if no settings exist
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Database error', details: error.message });
    }
});

// Post settings
app.post('/api/settings', authenticateToken, requireAdmin, async (req, res) => {
  const { storeName, contactEmail, contactPhone, taxRate, emailNotifications } = req.body;
  let connection;
  try {
    connection = await db.getConnection();
    const [results] = await connection.query(`SELECT COUNT(*) as count FROM settings`);
    const settingsExist = results[0].count > 0;
    let sql;
    let values;

    if (settingsExist) {
      sql = `UPDATE settings SET storeName = ?, contactEmail = ?, contactPhone = ?, taxRate = ?, emailNotifications = ?, updated_at = NOW() LIMIT 1`;
      values = [storeName, contactEmail, contactPhone, taxRate, emailNotifications];
    } else {
      sql = `INSERT INTO settings (storeName, contactEmail, contactPhone, taxRate, emailNotifications, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
      values = [storeName, contactEmail, contactPhone, taxRate, emailNotifications];
    }
    await connection.query(sql, values);
    res.json({ message: 'Settings saved successfully.' });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ message: 'Database error', details: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// ✅ API - קבלת כל הלקוחות (admin בלבד)
app.get('/api/customers', authenticateToken, requireAdmin, async (req, res) => {
  const sql = `SELECT user_id, name AS username, email, phone FROM users WHERE role = 'client'`;
  try {
    const [results] = await db.query(sql);
    console.log("Fetched customers:", results);
    res.json(results);
  } catch (err) {
    console.error('Error fetching customers:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Orders API - Admin only (for now, will be generalized later)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
  const sql = `
    SELECT
      o.order_id,
      o.order_date,
      o.total_price,
      o.status,
      u.name AS user_name,
      u.email AS user_email
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    ORDER BY o.order_date DESC;
  `;
  try {
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Update Order Status (Admin only)
app.put('/api/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = `UPDATE orders SET status = ? WHERE order_id = ?`;
  try {
    const [result] = await db.query(sql, [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Add this new endpoint for fetching product details by ID
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM products WHERE product_id = ?`;
  try {
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Add a new API endpoint to fetch the store name from admin_settings
app.get('/api/store-name', async (req, res) => {
  const sql = 'SELECT storeName FROM admin_settings LIMIT 1';
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(sql);
    if (rows.length === 0) {
      // Default store name if no settings found
      return res.json({ storeName: 'Tech Stock' });
    }
    res.json({ storeName: rows[0].storeName || 'Tech Stock' });
  } catch (err) {
    console.error('Error fetching store name:', err);
    res.status(500).json({ message: 'Database error', details: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Update user profile (name, phone, city, profile_image)
app.put('/api/profile/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, city, profile_image } = req.body;
  // Only allow user to update their own profile or admin
  if (parseInt(id) !== req.user.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
  if (city !== undefined) { fields.push('city = ?'); values.push(city); }
  if (profile_image !== undefined) { fields.push('profile_image = ?'); values.push(profile_image); }
  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
  values.push(id);
  try {
    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Catch-all to serve index.html for any other frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
