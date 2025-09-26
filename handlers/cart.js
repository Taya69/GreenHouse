import db from '../database.js';
import { getCartKeyboard } from '../keyboards/cart.js';
import { getMainKeyboard } from '../keyboards/main.js';
import { showCatalog } from './catalog.js';

export async function showCart(ctx) {
    try {
        const user = db.getUser(ctx.from.id);
        const cartItems = db.getCart(user.id);

        if (cartItems.length === 0) {
            await ctx.reply('🛒 Ваша корзина пуста');
            return;
        }

        let total = 0;
        let message = '🛒 *Ваша корзина:*\n\n';

        for (const item of cartItems) {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            message += `🎁 ${item.name}\n`;
            message += `   Количество: ${item.quantity}\n`;
            message += `   Цена: ${itemTotal} руб.\n\n`;
        }

        message += `💵 *Итого: ${total} руб.*`;

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: getCartKeyboard(cartItems)
        });
    } catch (error) {
        console.error('Error showing cart:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке корзины');
    }
}

export async function handleRemoveFromCart(ctx) {
    try {
        const productId = ctx.callbackQuery.data.split(':')[1];
        const user = db.getUser(ctx.from.id);
        
        await db.removeFromCart(user.id, parseInt(productId));
        await ctx.answerCallbackQuery('🗑️ Товар удален из корзины');
        
        // Обновляем сообщение корзины
        await ctx.deleteMessage();
        await showCart(ctx);
    } catch (error) {
        console.error('Error removing from cart:', error);
        await ctx.answerCallbackQuery('❌ Ошибка при удалении товара');
    }
}

export async function handleClearCart(ctx) {
    try {
        const user = db.getUser(ctx.from.id);
        await db.clearCart(user.id);
        await ctx.answerCallbackQuery('🗑️ Корзина очищена');
        await ctx.deleteMessage();
        await ctx.reply('🛒 Ваша корзина теперь пуста');
    } catch (error) {
        console.error('Error clearing cart:', error);
        await ctx.answerCallbackQuery('❌ Ошибка при очистке корзины');
    }
}

export async function handleCheckout(ctx) {
    try {
        const user = db.getUser(ctx.from.id);
        const cartItems = db.getCart(user.id);
        const contactInfo = db.getUserContactInfo(user.telegram_id);
        
        if (!contactInfo || !contactInfo.phone || !contactInfo.full_name) {
            await ctx.reply('📞 Для оформления заказа нам нужна ваша контактная информация.');
            await ctx.conversation.enter('getContactInfo');
        } else {
            // await createOrder(ctx, user.id, cartItems);
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        await ctx.reply('❌ Произошла ошибка при оформлении заказа');
    }
}

async function createOrder(ctx, userId, cartItems) {
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await ctx.reply('💬 Хотите добавить комментарий к заказу? (Если нет, отправьте "нет")');
    
    const commentCtx = await ctx.conversation.wait('message:text');
    const userComment = commentCtx.message.text.toLowerCase() === 'нет' ? '' : commentCtx.message.text;
    
    try {
        const orderId = db.createOrder(userId, cartItems, totalAmount, userComment);
        await db.clearCart(userId);
        
        await ctx.reply(
            `✅ Заказ #${orderId} оформлен успешно!\n` +
            `💵 Сумма: ${totalAmount} руб.\n` +
            `📊 Статус: Создан`
        );
        
        // Уведомление администраторов
        for (const adminId of config.ADMIN_IDS) {
            await ctx.api.sendMessage(
                adminId,
                `🛎️ Новый заказ #${orderId}\n💵 Сумма: ${totalAmount} руб.\n👤 Клиент: ${ctx.from.first_name}`
            );
        }
    } catch (error) {
        console.error('Error creating order:', error);
        await ctx.reply('❌ Произошла ошибка при оформлении заказа');
    }
}