//dbSingleton.js
const mysql = require('mysql2');

let connection; // Variable for storing a single connection

const dbSingleton = {
  getConnection: () => {
    if (!connection) {
      connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: 3307,
        password: '',
        database: 'techstock',
      }).promise(); // Use .promise() to enable async/await

      // No explicit connect call needed for promise-based connections, they connect on first query
      // Handle connection errors (still relevant for promise-based connections, but less direct)
      connection.on('error', err => {
        console.error('Database connection error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          connection = null;
        }
      });

      console.log('MySQL connection pool created (promise-based).');
    }

    return connection; // Return the current connection
  },
};

module.exports = dbSingleton;
