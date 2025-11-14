require('dotenv').config({ path: require('path').resolve(__dirname, '../env.config') });
const dbSingleton = require('../dbSingleton.js');

const db = dbSingleton.getConnection();

async function checkCancelledOrders() {
    let connection;
    
    try {
        connection = await db.getConnection();
        
        // Check for orders with 'Cancelled' status (case-sensitive)
        const [cancelledUpper] = await connection.query(`
            SELECT COUNT(*) as count FROM orders WHERE status = 'Cancelled'
        `);
        
        // Check for orders with 'cancelled' status (lowercase)
        const [cancelledLower] = await connection.query(`
            SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'
        `);
        
        // Check for orders with 'CANCELLED' status (uppercase)
        const [cancelledAllUpper] = await connection.query(`
            SELECT COUNT(*) as count FROM orders WHERE status = 'CANCELLED'
        `);
        
        // Get all unique status values
        const [allStatuses] = await connection.query(`
            SELECT DISTINCT status, COUNT(*) as count 
            FROM orders 
            GROUP BY status
        `);
        
        console.log('Orders with status "Cancelled":', cancelledUpper[0].count);
        console.log('Orders with status "cancelled":', cancelledLower[0].count);
        console.log('Orders with status "CANCELLED":', cancelledAllUpper[0].count);
        console.log('\nAll order statuses in database:');
        allStatuses.forEach(row => {
            console.log(`  ${row.status}: ${row.count} orders`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error checking cancelled orders:', error);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

checkCancelledOrders();

