const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
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

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
}; 