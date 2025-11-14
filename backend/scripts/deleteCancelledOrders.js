require('dotenv').config({ path: require('path').resolve(__dirname, '../env.config') });
const dbSingleton = require('../dbSingleton.js');

const db = dbSingleton.getConnection();

async function deleteCancelledOrders() {
    let connection;
    
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        console.log('Starting deletion of orders with status "confirmed"...');
        
        // First, delete all order_items for confirmed orders
        const [deleteItemsResult] = await connection.query(`
            DELETE oi FROM order_items oi
            INNER JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status = 'confirmed'
        `);
        
        console.log(`Deleted ${deleteItemsResult.affectedRows} order items from confirmed orders`);
        
        // Then, delete all confirmed orders
        const [deleteOrdersResult] = await connection.query(`
            DELETE FROM orders
            WHERE status = 'confirmed'
        `);
        
        console.log(`Deleted ${deleteOrdersResult.affectedRows} confirmed orders`);
        
        await connection.commit();
        console.log('Successfully deleted all confirmed orders and their items.');
        
        process.exit(0);
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error deleting cancelled orders:', error);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Run the script
deleteCancelledOrders();

