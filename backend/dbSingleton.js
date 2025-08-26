//dbSingleton.js
const mysql = require('mysql2');

let pool; // Change to pool instead of connection

const dbSingleton = {
  getConnection: () => {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        port: process.env.DB_PORT || 3306,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'techstock',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      }).promise(); // Use .promise() to enable async/await

      // Event listener for errors in the pool
      pool.on('error', err => {
        console.error('Database pool error:', err);
      });

      console.log('MySQL connection pool created (promise-based).');
    }

    return pool; // Return the connection pool
  },
};

module.exports = dbSingleton;
