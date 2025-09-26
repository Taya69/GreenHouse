import db from '../database.js';
import { getAdminKeyboard, getOrdersKeyboard, getOrderActionsKeyboard, getOrderStatusKeyboard } from '../keyboards/admin.js';
import { getMainKeyboard } from '../keyboards/main.js';
import config from '../config.js';
import { isAdmin, getOrderStatusText } from '../utils/helpers.js';

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
}

export async function showAllOrders(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }
    const orders = db.getAllOrders();
    
    if (orders.length === 0) {
        await ctx.reply('📦 Нет заказов');
    }

    for (const order of orders.slice(0, 10)) {
        const orderDetails = db.getOrderDetails(order.id);
        
        let message = `📦 *Заказ #${order.id}*\n`;
        message += `👤 Клиент: ${order.first_name} (@${order.username || 'нет'})\n`;
        message += `📞 Телефон: ${order.phone || 'не указан'}\n`;
        message += `💵 Сумма: ${order.total_amount} руб.\n`;
        message += `📅 Дата: ${new Date(order.created_at).toLocaleDateString()}\n`;
        message += `📊 Статус: ${getOrderStatusText(order.status)}\n`;
        
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
        console.log(order.id);  
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: getOrderStatusKeyboard(order.id)
        });  
    }
}

export async function showOrdersByStatus(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }
    const status = ctx.match?.[1] || ctx.session.filterStatus;
    if (!status) {
        await ctx.reply('Выберите статус заказов:', {
            reply_markup: getOrderStatusKeyboard(0)
        });
        return;
    }
    const orders = db.getOrdersByStatus(status);
    if (orders.length === 0) {
        await ctx.reply('📦 Нет заказов с таким статусом');
        return;
    }
    for (const order of orders.slice(0, 10)) {
        const orderDetails = db.getOrderDetails(order.id);
        let message = `📦 *Заказ #${order.id}*\n`;
        message += `👤 Клиент: ${order.first_name} (@${order.username || 'нет'})\n`;
        message += `📞 Телефон: ${order.phone || 'не указан'}\n`;
        message += `💵 Сумма: ${order.total_amount} руб.\n`;
        message += `📅 Дата: ${new Date(order.created_at).toLocaleDateString()}\n`;
        message += `📊 Статус: ${getOrderStatusText(order.status)}\n`;
        message += '\n*Товары:*\n';
        orderDetails.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${item.quantity} шт. x ${item.price} руб.\n`;
        });
        await ctx.reply(message, { parse_mode: 'Markdown' });
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

export async function showAdminCategories(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }
    const categories = db.getProductCategories();
    if (!categories || categories.length === 0) {
        await ctx.reply('😔 Нет категорий');
        return;
    }
    let message = '📂 Категории:\n\n';
    for (const c of categories) {
        message += `• ${c.name} (ID: ${c.id})\n`;
    }
    await ctx.reply(message);
}

export async function handleInlineEditCategory(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ Нет прав');
        return;
    }
    const categoryId = parseInt(ctx.callbackQuery.data.split(':')[1]);
    ctx.session.editingCategoryId = categoryId;
    await ctx.answerCallbackQuery('✏️ Редактирование категории');
    await ctx.conversation.enter('editCategory');
}

export async function handleInlineDeleteCategory(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ Нет прав');
        return;
    }
    const categoryId = parseInt(ctx.callbackQuery.data.split(':')[1]);
    try {
        const res = db.deleteProductCategory(categoryId);
        if (res > 0) {
            await ctx.answerCallbackQuery('✅ Категория удалена');
            await ctx.deleteMessage().catch(() => {});
        } else {
            await ctx.answerCallbackQuery('❌ Категория не найдена');
        }
    } catch (e) {
        console.error('Error deleting category:', e);
        await ctx.answerCallbackQuery('❌ Ошибка удаления');
    }
}

export async function handleInlineDeleteProduct(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ Нет прав');
        return;
    }
    const productId = parseInt(ctx.callbackQuery.data.split(':')[1]);
    try {
        const result = db.deleteProduct(productId);
        if (result > 0) {
            await ctx.answerCallbackQuery('✅ Товар удален');
            await ctx.deleteMessage();
        } else {
            await ctx.answerCallbackQuery('❌ Товар не найден');
        }
    } catch (error) {
        console.error('Error inline deleting product:', error);
        await ctx.answerCallbackQuery('❌ Ошибка удаления');
    }
}

export async function handleInlineEditProduct(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ Нет прав');
        return;
    }
    const productId = parseInt(ctx.callbackQuery.data.split(':')[1]);
    console.log('handleInlineEditProduct', productId);
    // Persist product id into both ctx.session and conversation.session for reliability
    ctx.session.editingProductId = productId;
    await ctx.answerCallbackQuery('✏️ Редактирование товара');
    await ctx.conversation.enter('editProduct');
}