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

// New: API for fetching user profile by ID
app.get('/api/profile/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const requestingUserId = req.user.user_id; // User ID from authenticated token
  const requestingUserRole = req.user.role; // User role from authenticated token

  console.log(`Received GET /api/profile/${id} request from user ${requestingUserId} (role: ${requestingUserRole}).`);

  // Ensure a user can only view their own profile, or an admin can view any profile
  if (parseInt(id) !== requestingUserId && requestingUserRole !== 'admin') {
    console.warn(`Access Denied: User ${requestingUserId} attempted to access profile ${id}.`);
    return res.status(403).json({ message: 'Access Denied: You can only view your own profile unless you are an admin.' });
  }

  const sql = `SELECT user_id, email, name, phone, city FROM users WHERE user_id = ?`;
  try {
    const [results] = await db.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const userProfile = results[0];
    console.log(`Successfully fetched profile for user ${id}.`);
    res.json(userProfile);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ message: 'Database error', details: err.message });
  }
});

// Add a new category (admin only)
app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  // Implementation of adding a new category
}); 