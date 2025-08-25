//dbSingleton.js
const mysql = require('mysql2');

let pool; // Change to pool instead of connection

const dbSingleton = {
  getConnection: () => {
    if (!pool) {
      pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        port: 3306,
        password: '',
        database: 'techstock',
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
