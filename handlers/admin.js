import db from '../database.js';
import { getAdminKeyboard, getOrdersKeyboard, getOrderStatusKeyboard } from '../keyboards/admin.js';
import { getAdminProductKeyboard } from '../keyboards/catalog.js';
import { getCategoryManagementKeyboard, getCategoriesManagementKeyboard } from '../keyboards/categories.js';
import { getMainKeyboard } from '../keyboards/main.js';
import config from '../config.js';
import { isAdmin, getOrderStatusText } from '../utils/helpers.js';
import { escapeMarkdown } from '../utils/markdown.js';
import { resizeImageFromUrl } from '../utils/image.js';
import { InlineKeyboard } from 'grammy';
import { getUserOrderStatusKeyboard } from '../keyboards/orders.js';

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
        
        if (stat.status === 'completed') {
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
        
        let message = `📦 *Заказ #${order.id}* (Пользовательский #${order.user_order_number})\n`;
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
        message = escapeMarkdown(message);  
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: getOrderStatusKeyboard(order.id)
        });  
    }
}

export async function showAdminOrdersByStatus(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }
    // const keyboard = new InlineKeyboard()
    // .text('🔎 Заказы по статусу', async (ctx) => {
        const kb = InlineKeyboard.from([
            [
                InlineKeyboard.text('📝 Создан', 'admin_filter_status:created'),
                InlineKeyboard.text('✅ Принят', 'admin_filter_status:accepted')
            ],
            [
                InlineKeyboard.text('🚚 Исполнен', 'admin_filter_status:completed'),
                InlineKeyboard.text('❌ Отклонён', 'admin_filter_status:rejected')
            ],
            [
                InlineKeyboard.text('❌ Отменён', 'admin_filter_status:cancelled')
            ]
        ]);
        await ctx.reply('Выберите статус:', { reply_markup: kb });
    // }) 
    // await ctx.reply('Выберете статус', {
    //     parse_mode: 'Markdown',
    //     reply_markup: keyboard
    // });  
    
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
        let message = `📦 *Заказ #${order.id}* (Пользовательский #${order.user_order_number})\n`;
        message += `👤 Клиент: ${order.first_name} (@${order.username || 'нет'})\n`;
        message += `📞 Телефон: ${order.phone || 'не указан'}\n`;
        message += `💵 Сумма: ${order.total_amount} руб.\n`;
        message += `📅 Дата: ${new Date(order.created_at).toLocaleDateString()}\n`;
        message += `📊 Статус: ${getOrderStatusText(order.status)}\n`;
        message += `📊 Кооментарий администратора: ${order.admin_comment}\n`;
        message += `📊 Кооментарий пользователя: ${order.user_comment}\n`;
        message += '\n*Товары:*\n';
        orderDetails.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${item.quantity} шт. x ${item.price} руб.\n`;
        });
        message = escapeMarkdown(message); 
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: getOrderStatusKeyboard(order.id)
        });
    }
}

export async function handleOrderStatusChange(ctx) {
    const [_, orderId, status] = ctx.callbackQuery.data.split(':');
    
    ctx.session.editingOrder = { 
        orderId: parseInt(orderId), 
        status: getOrderStatusText(status) 
    };
    
    await ctx.reply(`Введите комментарий для статуса "${getOrderStatusText(status)}":`);
    await ctx.conversation.enter('updateOrderStatus');
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

export async function handleAddCategory(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }
    await ctx.reply('➕ *Добавление новой категории*\n\nВведите название новой категории:', {
        parse_mode: 'Markdown'
    });
    await ctx.conversation.enter('addProductCategory');
}

export async function showAdminCategories(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.reply('❌ У вас нет прав администратора');
        return;
    }
    const categories = db.getProductCategories();
    if (!categories || categories.length === 0) {
        await ctx.reply('😔 Нет категорий', {
            reply_markup: getCategoriesManagementKeyboard()
        });
        return;
    }
    
    // Показываем заголовок
    await ctx.reply('📂 *Управление категориями*\n\nВыберите категорию для редактирования:', {
        parse_mode: 'Markdown',
        reply_markup: getCategoriesManagementKeyboard()
    });
    
    // Показываем каждую категорию с кнопками управления
    for (const category of categories) {
        const message = `📂 *${category.name}*\nID: ${category.id}`;
        const keyboard = getCategoryManagementKeyboard(category.id);
        
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    }
}

export async function handleInlineEditCategory(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ Нет прав');
        return;
    }
    const categoryId = parseInt(ctx.callbackQuery.data.split(':')[1]);
    const category = db.getProductCategoryById(categoryId);
    
    if (!category) {
        await ctx.answerCallbackQuery('❌ Категория не найдена');
        return;
    }
    
    ctx.session.editingCategoryId = categoryId;
    await ctx.answerCallbackQuery('✏️ Редактирование категории');
    await ctx.reply(`✏️ *Редактирование категории*\n\nТекущее название: *${category.name}*\n\nВведите новое название категории:`, {
        parse_mode: 'Markdown'
    });
    await ctx.conversation.enter('editCategory');
}

export async function handleInlineDeleteCategory(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ Нет прав');
        return;
    }
    const categoryId = parseInt(ctx.callbackQuery.data.split(':')[1]);
    const category = db.getProductCategoryById(categoryId);
    
    if (!category) {
        await ctx.answerCallbackQuery('❌ Категория не найдена');
        return;
    }
    
    try {
        // Проверяем, есть ли товары в этой категории
        const products = db.getProductsAny(categoryId);
        if (products && products.length > 0) {
            await ctx.answerCallbackQuery('❌ Нельзя удалить категорию с товарами');
            return;
        }
        
        const res = db.deleteProductCategory(categoryId);
        if (res > 0) {
            await ctx.answerCallbackQuery('✅ Категория удалена');
            await ctx.editMessageText(`🗑️ *Категория "${category.name}" удалена*`, {
                parse_mode: 'Markdown'
            });
        } else {
            await ctx.answerCallbackQuery('❌ Ошибка удаления');
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

export async function handleIncreaseStock(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ У вас нет прав администратора');
        return;
    }
    
    const productId = parseInt(ctx.callbackQuery.data.split(':')[1]);
    const product = db.getProductById(productId);
    
    if (!product) {
        await ctx.answerCallbackQuery('❌ Товар не найден');
        return;
    }
    
    const newStock = product.stock + 1;
    const result = db.updateProductStock(productId, newStock);
    
    if (result > 0) {
        await ctx.answerCallbackQuery(`✅ Количество увеличено до ${newStock} шт.`);
        // Обновляем сообщение с новым количеством
        await updateProductMessage(ctx, productId);
    } else {
        await ctx.answerCallbackQuery('❌ Ошибка обновления');
    }
}

export async function handleDecreaseStock(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ У вас нет прав администратора');
        return;
    }
    
    const productId = parseInt(ctx.callbackQuery.data.split(':')[1]);
    const product = db.getProductById(productId);
    
    if (!product) {
        await ctx.answerCallbackQuery('❌ Товар не найден');
        return;
    }
    
    if (product.stock <= 0) {
        await ctx.answerCallbackQuery('❌ Количество не может быть отрицательным');
        return;
    }
    
    const newStock = product.stock - 1;
    const result = db.updateProductStock(productId, newStock);
    
    if (result > 0) {
        await ctx.answerCallbackQuery(`✅ Количество уменьшено до ${newStock} шт.`);
        // Обновляем сообщение с новым количеством
        await updateProductMessage(ctx, productId);
    } else {
        await ctx.answerCallbackQuery('❌ Ошибка обновления');
    }
}

async function updateProductMessage(ctx, productId) {
    try {
        const product = db.getProductById(productId);
        if (!product) return;
        
        let message = `🎁 *${product.name}*\n`;
        message += `💰 Цена: ${product.price} руб.\n`;
        message += `📦 В наличии: ${product.stock} шт.\n`;
        if (product.category_name) {
            message += `📂 Категория: ${product.category_name}\n`;
        }
        message += `📝 ${product.description}\n\n`;
        
        // Получаем категорию из контекста или из продукта
        const categoryId = product.category_id;
        
        const keyboard = getAdminProductKeyboard(product, product.is_available);
        
        // if (product.image_url) {
        //     try {
        //         const resizedPath = await resizeImageFromUrl(product.image_url, 320);
        //         await ctx.editMessageCaption(message, {
        //             parse_mode: 'Markdown',
        //             reply_markup: keyboard
        //         });
        //         await safeUnlink(resizedPath);
        //     } catch (e) {
        //         console.error('Image resize failed, updating original:', e);
        //         await ctx.editMessageCaption(message, {
        //             parse_mode: 'Markdown',
        //             reply_markup: keyboard
        //         });
        //     }
        // } else {
            await ctx.editMessageText(message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        // }
    } catch (error) {
        console.error('Error updating product message:', error);
    }
}

export async function showUsers(ctx) {
    try {
        const users = db.getUsers();

        // Показываем клавиатуру выбора статуса
        for (const user of users) {
            let message = `📂 ${user.full_name} (ID: ${user.id}) (tgID: ${user.telegram_id}) ${user.phone}`
            message += `\n${user.username}\n`;
            await ctx.reply(message);
        }
    } catch (error) {
        console.error('Error showing users:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке пользователей');
    }
}

export async function toggleProductAvailability(ctx) {
    if (!isAdmin(ctx.from.id)) {
        await ctx.answerCallbackQuery('❌ Недостаточно прав');
        return;
    }
    

    try {
        const productId = parseInt(ctx.callbackQuery.data.split(':')[1]);
        const product = db.getProductById(productId);
        
        if (!product) {
            await ctx.answerCallbackQuery('❌ Товар не найден');
            return;
        }
        
        // Переключаем доступность
        const newAvailability = !product.is_available;
        db.toggleProductAvailability(productId, newAvailability);
        
        const statusText = newAvailability ? 'доступен' : 'скрыт';
        const emoji = newAvailability ? '✅' : '❌';
        
        await ctx.answerCallbackQuery(`${emoji} Товар теперь ${statusText}`);
        
        // Обновляем сообщение
        try {
            await ctx.editMessageReplyMarkup({
                reply_markup: getAdminProductKeyboard(product, newAvailability)
            });
        } catch (editError) {
            // Если не удалось обновить сообщение, просто отправляем ответ
            console.log('Could not update message markup');
        }
        
    } catch (error) {
        console.error('Error toggling product availability:', error);
        await ctx.answerCallbackQuery('❌ Ошибка при изменении статуса');
    }
}