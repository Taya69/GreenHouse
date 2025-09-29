import db from '../database.js';

export async function migrateOrdersToUserNumbers() {
    console.log('Starting orders migration...');
    
    try {
        // Получаем всех пользователей с заказами
        const usersWithOrders = db.db.prepare(`
            SELECT DISTINCT user_id FROM orders 
            WHERE user_order_number IS NULL
        `).all();
        
        let migratedCount = 0;
        
        for (const { user_id } of usersWithOrders) {
            // Получаем заказы пользователя по дате создания
            const userOrders = db.db.prepare(`
                SELECT id FROM orders 
                WHERE user_id = ? 
                ORDER BY created_at ASC
            `).all(user_id);
            
            // Присваиваем порядковые номера
            userOrders.forEach((order, index) => {
                db.db.prepare(`
                    UPDATE orders SET user_order_number = ? 
                    WHERE id = ?
                `).run(index + 1, order.id);
            });
            
            migratedCount += userOrders.length;
            console.log(`Migrated ${userOrders.length} orders for user ${user_id}`);
        }
        
        console.log(`✅ Migration completed: ${migratedCount} orders migrated`);
        
    } catch (error) {
        console.error('Migration error:', error);
    }
}