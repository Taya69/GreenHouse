import db from '../database.js';
import { getOrderStatusText } from '../utils/helpers.js';
import { getUserOrderStatusKeyboard, getUserOrderKeyboard } from '../keyboards/orders.js';
import config from '../config.js';

export async function showUserOrders(ctx) {
    try {
        const user = db.getUser(ctx.from.id);
        const orders = db.getUserOrders(user.id);

        if (orders.length === 0) {
            await ctx.reply('📦 У вас пока нет заказов');
            return;
        }

        // Показываем клавиатуру выбора статуса
        await ctx.reply('📋 Выберите статус заказов для просмотра:', {
            reply_markup: getUserOrderStatusKeyboard()
        });
    } catch (error) {
        console.error('Error showing orders:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке заказов');
    }
}

export async function showUserOrdersByStatus(ctx, status) {
    try {
        const user = db.getUser(ctx.from.id);
        let orders = db.getUserOrders(user.id);
        // Фильтруем заказы по статусу, если выбран не "все"
        if (status !== 'all') {
            orders = orders.filter(order => order.status === status);
        }

        if (orders.length === 0) {
            const statusText = status === 'all' ? 'заказов' : getOrderStatusText(status).toLowerCase();
            await ctx.reply(`📦 У вас пока нет ${statusText}`);
            return;
        }

        for (const order of orders) {
            const orderDetails = db.getOrderDetails(order.id);
            
            let message = `📦 *Заказ #${order.user_order_number}*\n`;
            message += `💵 Сумма: ${order.total_amount} руб.\n`;
            message += `📅 Дата: ${new Date(order.created_at).toLocaleDateString()}\n`;
            message += `📊 Статус: ${getOrderStatusText(order.status)}\n`;
            
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

            await ctx.reply(message, { 
                parse_mode: 'Markdown',
                reply_markup: getUserOrderKeyboard(order.id, order.status)
            });
        }
    } catch (error) {
        console.error('Error showing orders by status:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке заказов');
    }
}

export async function handleUserOrderStatusFilter(ctx) {
    try {
        const status = ctx.callbackQuery.data.split(':')[1];
        await ctx.answerCallbackQuery();
        await showUserOrdersByStatus(ctx, status);
    } catch (error) {
        console.error('Error handling user order status filter:', error);
        await ctx.answerCallbackQuery('❌ Произошла ошибка');
    }
}

export async function handleUserCancelOrder(ctx) {
    try {
        const orderId = parseInt(ctx.callbackQuery.data.split(':')[1]);
        const user = db.getUser(ctx.from.id);
        const order = db.getOrderById(orderId);
        
        if (!order) {
            await ctx.answerCallbackQuery('❌ Заказ не найден');
            return;
        }
        
        // Проверяем, что заказ принадлежит пользователю
        if (order.user_id !== user.id) {
            await ctx.answerCallbackQuery('❌ У вас нет прав на отмену этого заказа');
            return;
        }
        
        // Проверяем, что заказ можно отменить
        if (order.status !== 'created' && order.status !== 'accepted') {
            await ctx.answerCallbackQuery('❌ Этот заказ нельзя отменить');
            return;
        }
        
        // Обновляем статус заказа на "отменён"
        db.updateOrderStatus(orderId, 'cancelled', 'Отменён пользователем');
        
        await ctx.answerCallbackQuery('✅ Заказ отменён');
        
        // Отправляем уведомление администратору
        await notifyAdminAboutOrderCancellation(ctx, order, user);
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        await ctx.answerCallbackQuery('❌ Произошла ошибка при отмене заказа');
    }
}

async function notifyAdminAboutOrderCancellation(ctx, order, user) {
    try {        
        const orderDetails = db.getOrderDetails(order.id);
        
        let message = `🚨 *УВЕДОМЛЕНИЕ ОБ ОТМЕНЕ ЗАКАЗА*\n\n`;
        message += `📦 *Заказ #${order.id}*  (Пользовательский #${order.user_order_number}) отменён пользователем\n`;
        message += `👤 *Пользователь:* ${user.first_name} ${user.last_name || ''}\n`;
        message += `📱 *Telegram ID:* ${user.telegram_id}\n`;
        message += `📞 *Телефон:* ${user.phone || 'Не указан'}\n`;
        message += `💵 *Сумма заказа:* ${order.total_amount} руб.\n`;
        message += `📅 *Дата создания:* ${new Date(order.created_at).toLocaleString()}\n`;
        message += `📅 *Дата отмены:* ${new Date().toLocaleString()}\n\n`;
        
        message += `*Товары в заказе:*\n`;
        orderDetails.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${item.quantity} шт. x ${item.price} руб.\n`;
        });
        
        // Отправляем уведомление всем администраторам
        for (const adminId of config.ADMIN_IDS) {
            try {
            await ctx.api.sendMessage(
                adminId,
                message
            );
            } catch (error) {
                console.error(`Failed to notify admin ${adminId}:`, error);
            }
        }
    } catch (error) {
        console.error('Error notifying admin about order cancellation:', error);
    }
}