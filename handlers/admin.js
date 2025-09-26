import db from '../database.js';
import { getAdminKeyboard, getOrdersKeyboard, getOrderActionsKeyboard, getOrderStatusKeyboard } from '../keyboards/admin.js';
import { getMainKeyboard } from '../keyboards/main.js';
import config from '../config.js';
import { isAdmin } from '../utils/helpers.js';

export async function showAdminPanel(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }

    await ctx.reply('👑 *Админ панель*', {
        parse_mode: 'Markdown',
        reply_markup: getAdminKeyboard()
    });
}

export async function showAdminStats(ctx) {
    const stats = db.getOrderStats();
    
    let message = '📊 *Статистика магазина:*\n\n';
    
    let totalOrders = 0;
    let totalRevenue = 0;
    
    stats.forEach(stat => {
        totalOrders += stat.status_count;
        if (stat.status === config.ORDER_STATUSES.COMPLETED) {
            totalRevenue += stat.total_revenue || 0;
        }
        message += `📦 ${stat.status}: ${stat.status_count} заказов\n`;
    });
    
    message += `\n💵 Общая выручка: ${totalRevenue} руб.\n`;
    message += `📈 Средний чек: ${totalRevenue > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0} руб.\n`;
    message += `👥 Всего заказов: ${totalOrders}`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
    await ctx.reply('Главное меню:', {
                reply_markup: getAdminKeyboard()
        });
}

export async function showAllOrders(ctx) {
    const orders = db.getAllOrders();
    
    if (orders.length === 0) {
        await ctx.reply('📦 Нет заказов');
        await ctx.reply('Главное меню:', {
                reply_markup: getAdminKeyboard()
        });
        return;
    }

    for (const order of orders.slice(0, 10)) {
        const orderDetails = db.getOrderDetails(order.id);
        
        let message = `📦 *Заказ #${order.id}*\n`;
        message += `👤 Клиент: ${order.first_name} (@${order.username || 'нет'})\n`;
        message += `📞 Телефон: ${order.phone || 'не указан'}\n`;
        message += `💵 Сумма: ${order.total_amount} руб.\n`;
        message += `📅 Дата: ${new Date(order.created_at).toLocaleDateString()}\n`;
        message += `📊 Статус: ${order.status}\n`;
        
        if (order.user_comment) {
            message += `💬 Комментарий клиента: ${order.user_comment}\n`;
        }
        
        if (order.admin_comment) {
            message += `👑 Ваш комментарий: ${order.admin_comment}\n`;
        }
        
        message += '\n*Товары:*\n';

        orderDetails.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${item.quantity} шт. x ${item.price} руб.\n`;
        });  
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: getOrderActionsKeyboard(order.id)
        });  
        await ctx.reply('Главное меню:', {
                reply_markup: getAdminKeyboard()
        });
    }
}

export async function handleOrderStatusChange(ctx) {
    const [_, orderId, status] = ctx.callbackQuery.data.split(':');
    
    ctx.session.editingOrder = { 
        orderId: parseInt(orderId), 
        status: getStatusFromKey(status) 
    };
    
    await ctx.reply(`Введите комментарий для статуса "${getStatusFromKey(status)}":`);
    await ctx.conversation.enter('updateOrderStatus');
}

function getStatusFromKey(key) {
    const statusMap = {
        'created': config.ORDER_STATUSES.CREATED,
        'accepted': config.ORDER_STATUSES.ACCEPTED,
        'completed': config.ORDER_STATUSES.COMPLETED,
        'rejected': config.ORDER_STATUSES.REJECTED
    };
    return statusMap[key] || key;
}

export async function showAdminProducts(ctx) {
    const products = db.getProducts();

    if (products.length === 0) {
        await ctx.reply('😔 Нет товаров');
        return;
    }

    let message = '🗑️ *Товары для удаления:*\n\n';
    
    for (const product of products) {
        message += `🎁 ${product.name} - ${product.price} руб. (ID: ${product.id})\n`;
    }

    message += '\nДля удаления товара используйте команду /delete_product [ID]';

    await ctx.reply(message);
    await ctx.reply('Главное меню:', {
                reply_markup: getAdminKeyboard()
        });
}

export async function handleAddProduct(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }

    await ctx.reply('Введите данные нового товара:');
    await ctx.conversation.enter('addProduct');
}

export async function handleAddProductCategory(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }
    console.log('handleAddProductCategory');
    await ctx.reply('Введите данные нового товара:');
    await ctx.conversation.enter('addProductCategory');
}

export async function handleDeleteProduct(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }

    const productId = ctx.message.text.split(' ')[1];
    
    if (!productId) {
        await ctx.reply('❌ Укажите ID товара: /delete_product [ID]');
        return;
    }

    try {
        const result = db.deleteProduct(parseInt(productId));
        if (result > 0) {
            await ctx.reply('✅ Товар успешно удален');
        } else {
            await ctx.reply('❌ Товар с таким ID не найден');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        await ctx.reply('❌ Ошибка при удалении товара');
    }
}