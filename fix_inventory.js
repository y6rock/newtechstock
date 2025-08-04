const dbSingleton = require('./dbSingleton.js');

async function fixInventory() {
    const db = dbSingleton.getConnection();

    try {
        console.log('Fixing negative inventory values...');
        
        // Fix negative inventory to zero
        const [result] = await db.query(
            'UPDATE products SET stock = 0 WHERE stock < 0'
        );
        
        console.log(`Fixed ${result.affectedRows} products with negative inventory.`);
        
        // Show products with zero stock
        const [products] = await db.query(
            'SELECT product_id, name, stock FROM products WHERE stock = 0'
        );
        
        console.log('\nProducts with zero stock (Out of Stock):');
        products.forEach(product => {
            console.log(`- ${product.name} (ID: ${product.product_id})`);
        });
        
        console.log(`\nTotal products out of stock: ${products.length}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

fixInventory(); 