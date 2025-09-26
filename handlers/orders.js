import db from '../database.js';

export async function showUserOrders(ctx) {
    try {
        const user = db.getUser(ctx.from.id);
        const orders = db.getUserOrders(user.id);

        if (orders.length === 0) {
            await ctx.reply('📦 У вас пока нет заказов');
            return;
        }

        for (const order of orders) {
            const orderDetails = db.getOrderDetails(order.id);
            
            let message = `📦 *Заказ #${order.id}*\n`;
            message += `💵 Сумма: ${order.total_amount} руб.\n`;
            message += `📅 Дата: ${new Date(order.created_at).toLocaleDateString()}\n`;
            message += `📊 Статус: ${order.status}\n`;
            
            if (order.user_comment) {
                message += `💬 Ваш комментарий: ${order.user_comment}\n`;
            }
            
            if (order.admin_comment) {
                message += `👑 Комментарий администратора: ${order.admin_comment}\n`;
            }
            
            message += '\n*Товары:*\n';

            orderDetails.forEach((item, index) => {
                message += `${index + 1}. ${item.name} - ${item.quantity} шт. x ${item.price} руб.\n`;
            });

            await ctx.reply(message, { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error('Error showing orders:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке заказов');
    }
}