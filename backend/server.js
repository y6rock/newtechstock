const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Singleton DB connection
const dbSingleton = require('./dbSingleton.js'); 

let authRoutes, productRoutes, userRoutes, promotionRoutes, orderRoutes, adminRoutes, supplierRoutes, categoryRoutes, settingsRoutes, contactRoutes;
try {
    authRoutes = require('./src/routes/auth.js');
    productRoutes = require('./src/routes/products.js');
    userRoutes = require('./src/routes/users.js');
    promotionRoutes = require('./src/routes/promotions.js');
    orderRoutes = require('./src/routes/orders.js');
    adminRoutes = require('./src/routes/admin.js');
    supplierRoutes = require('./src/routes/suppliers.js');
    categoryRoutes = require('./src/routes/categories.js');
    settingsRoutes = require('./src/routes/settings.js');
    contactRoutes = require('./src/routes/contact.js');
} catch (error) {
    console.error('--- A FATAL ERROR OCCURRED DURING SERVER STARTUP ---');
    console.error('This is likely an incorrect file path in one of the `require` statements.');
    console.error(error);
    process.exit(1);
}

// Initialize Express app
const app = express();

// Core Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes); // CORRECTED: Mounts /login, /register, etc. under /api/auth
app.use('/api/products', productRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);

// General API health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Serve frontend build in production
// This part should be adjusted based on your deployment strategy
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
