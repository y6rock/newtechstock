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

  jwt.verify(token, 'secretKey', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// פונקציית בדיקת הרשאות אדמין
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin only' });
  next();
};

// ✅ API - הרשמה
app.post('/api/register', (req, res) => {
  const { email, password, name, phone, city } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql = `INSERT INTO users (email, password, name, phone, city) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [email, hashedPassword, name, phone, city], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ message: 'Email already exists' });
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json({ message: 'User registered successfully' });
  });
});

// ✅ API - התחברות
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0)
      return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, username: user.name },
      'secretKey',
      { expiresIn: '1h' },
    );
    res.json({ message: 'Login successful', token });
  });
});

// ✅ API - הוספת מוצר (admin בלבד)
app.post('/api/products', authenticateToken, (req, res) => {
  const { name, description, price, stock, image, supplier_id, category_id } = req.body;
  if (!name || !description || !price || !stock || !image) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const sql = `INSERT INTO products (name, description, price, stock, image, supplier_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [name, description, price, stock, image, supplier_id || null, category_id || null], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json({ message: 'Product added successfully' });
  });
});

// ✅ API - קבלת כל המוצרים
app.get('/api/products', (req, res) => {
  const sql = `SELECT * FROM products`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(results);
  });
});

// Get all suppliers
app.get('/api/suppliers', (req, res) => {
  const sql = 'SELECT * FROM suppliers';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

// Get all categories
app.get('/api/categories', (req, res) => {
  const sql = 'SELECT * FROM categories';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(results);
  });
});

// ===================== ORDER MANAGEMENT =====================

// Create a new order (user)
app.post('/api/orders', authenticateToken, (req, res) => {
  const user_id = req.user.user_id;
  const { products } = req.body; // [{ product_id, quantity }]
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'No products in order' });
  }
  // Calculate total price
  const productIds = products.map(p => p.product_id);
  const sqlGetProducts = `SELECT product_id, price, stock FROM products WHERE product_id IN (${productIds.map(() => '?').join(',')})`;
  db.query(sqlGetProducts, productIds, (err, dbProducts) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    // Check stock
    for (const p of products) {
      const dbProduct = dbProducts.find(dp => dp.product_id === p.product_id);
      if (!dbProduct || dbProduct.stock < p.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${p.product_id}` });
      }
    }
    const total_price = products.reduce((sum, p) => {
      const dbProduct = dbProducts.find(dp => dp.product_id === p.product_id);
      return sum + (dbProduct.price * p.quantity);
    }, 0);
    // Insert order
    const sqlOrder = `INSERT INTO orders (user_id, total_price) VALUES (?, ?)`;
    db.query(sqlOrder, [user_id, total_price], (err, orderResult) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      const order_id = orderResult.insertId;
      // Insert order products
      const orderProductsValues = products.map(p => [order_id, p.product_id, p.quantity]);
      const sqlOrderProducts = `INSERT INTO orders_products (order_id, product_id, quantity) VALUES ?`;
      db.query(sqlOrderProducts, [orderProductsValues], (err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        // Update product stock
        let updateCount = 0;
        for (const p of products) {
          const sqlUpdateStock = `UPDATE products SET stock = stock - ? WHERE product_id = ?`;
          db.query(sqlUpdateStock, [p.quantity, p.product_id], (err) => {
            updateCount++;
            if (err && updateCount === products.length) {
              return res.status(500).json({ message: 'Database error', error: err });
            }
            if (updateCount === products.length) {
              res.json({ message: 'Order placed successfully', order_id });
            }
          });
        }
      });
    });
  });
});

// Get all orders (admin only)
app.get('/api/orders', authenticateToken, requireAdmin, (req, res) => {
  const sql = `SELECT o.order_id, o.date, o.total_price, o.user_id, u.email, u.name
               FROM orders o JOIN users u ON o.user_id = u.user_id ORDER BY o.date DESC`;
  db.query(sql, (err, orders) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    // Get products for each order
    const orderIds = orders.map(o => o.order_id);
    if (orderIds.length === 0) return res.json([]);
    const sqlProducts = `SELECT op.order_id, op.product_id, op.quantity, p.name, p.price
                        FROM orders_products op JOIN products p ON op.product_id = p.product_id
                        WHERE op.order_id IN (${orderIds.map(() => '?').join(',')})`;
    db.query(sqlProducts, orderIds, (err, orderProducts) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      // Attach products to orders
      orders.forEach(order => {
        order.products = orderProducts.filter(op => op.order_id === order.order_id);
      });
      res.json(orders);
    });
  });
});

// Get orders for logged-in user
app.get('/api/myorders', authenticateToken, (req, res) => {
  const user_id = req.user.user_id;
  const sql = `SELECT o.order_id, o.date, o.total_price
               FROM orders o WHERE o.user_id = ? ORDER BY o.date DESC`;
  db.query(sql, [user_id], (err, orders) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (orders.length === 0) return res.json([]);
    const orderIds = orders.map(o => o.order_id);
    const sqlProducts = `SELECT op.order_id, op.product_id, op.quantity, p.name, p.price
                        FROM orders_products op JOIN products p ON op.product_id = p.product_id
                        WHERE op.order_id IN (${orderIds.map(() => '?').join(',')})`;
    db.query(sqlProducts, orderIds, (err, orderProducts) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      orders.forEach(order => {
        order.products = orderProducts.filter(op => op.order_id === order.order_id);
      });
      res.json(orders);
    });
  });
});

// Image upload endpoint
app.post('/api/upload-image', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// ✅ API - Get Settings (Admin only)
app.get('/api/settings', authenticateToken, requireAdmin, (req, res) => {
  // Assuming a settings table exists and has a single row for global settings
  const sql = `SELECT storeName, contactEmail, contactPhone, taxRate, emailNotifications FROM settings LIMIT 1`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error fetching settings:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    // If settings exist, return the first row, otherwise return empty object
    res.json(results.length > 0 ? results[0] : {});
  });
});

// ✅ API - Save Settings (Admin only)
app.post('/api/settings', authenticateToken, requireAdmin, (req, res) => {
  const { storeName, contactEmail, contactPhone, taxRate, emailNotifications } = req.body;
  // Assuming a settings table exists and we want to update or insert a single row
  // This is a simple upsert logic, you might need a more robust approach depending on your DB schema
  const sqlCheckExists = `SELECT COUNT(*) as count FROM settings`;
  db.query(sqlCheckExists, (err, results) => {
    if (err) {
      console.error('Database error checking settings existence:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    const settingsExist = results[0].count > 0;
    let sql;
    let values;

    if (settingsExist) {
      // Update existing settings (assuming a primary key or unique way to identify the single row)
      // For simplicity, this example assumes you update the first/only row. Adjust as needed.
      sql = `UPDATE settings SET storeName = ?, contactEmail = ?, contactPhone = ?, taxRate = ?, emailNotifications = ? LIMIT 1`;
      values = [storeName, contactEmail, contactPhone, taxRate, emailNotifications];
    } else {
      // Insert new settings
      sql = `INSERT INTO settings (storeName, contactEmail, contactPhone, taxRate, emailNotifications) VALUES (?, ?, ?, ?, ?)`;
      values = [storeName, contactEmail, contactPhone, taxRate, emailNotifications];
    }

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Database error saving settings:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: 'Settings saved successfully' });
    });
  });
});

// שרת מאזין
app.listen(3001, () => {
  console.log('Server running on port 3001');
});
