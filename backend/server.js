const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dbSingleton = require('./dbSingleton');

// Execute a query to the database
const db = dbSingleton.getConnection();

const app = express();
app.use(cors());
app.use(express.json());

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
      { user_id: user.user_id, role: user.role },
      'secretKey',
      { expiresIn: '1h' },
    );
    res.json({ message: 'Login successful', token });
  });
});

// ✅ API - הוספת מוצר (admin בלבד)
app.post('/api/products', authenticateToken, requireAdmin, (req, res) => {
  const { name, description, price, stock, image } = req.body;
  const sql = `INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [name, description, price, stock, image], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });
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

// שרת מאזין
app.listen(3001, () => {
  console.log('Server running on port 3001');
});
