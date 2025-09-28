import db from '../database.js';
import { getCartKeyboard } from '../keyboards/cart.js';
import { getMainKeyboard } from '../keyboards/main.js';
import { handleAddToCart, showCatalog } from './catalog.js';

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
        // await ctx.deleteMessage();
        // await showCart(ctx);
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

export async function handleUpdateCart(ctx) {
    try {
        await ctx.answerCallbackQuery('🔄 Корзина обновлена');
        await ctx.deleteMessage();
        await showCart(ctx);
    } catch (error) {
        console.error('Error updating cart:', error);
        await ctx.answerCallbackQuery('❌ Ошибка при обновлении корзины');
    }
}

async function updateCartChange(ctx, productId) {
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
        
        const keyboard = getAdminProductKeyboard(product, categoryId);
        
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

export async function handleCartIncrease(ctx) {
    try {
        const productId = parseInt(ctx.callbackQuery.data.split(':')[1]);
        const user = db.getUser(ctx.from.id);
        const product = db.getProductById(productId);
        
        if (!product) {
            await ctx.answerCallbackQuery('❌ Товар не найден');
            return;
        }

        const cartItem = db.getCartItem(user.id, productId);
        
        if (!cartItem) {
            handleAddToCart(ctx);
            // await ctx.answerCallbackQuery('❌ Товар не найден в корзине');
            return;
        }

        // Проверяем, не превышает ли количество доступное на складе
        if (cartItem.quantity >= product.stock) {
            await ctx.answerCallbackQuery('❌ Недостаточно товара на складе');
            return;
        }

        // Увеличиваем количество
        const newQuantity = cartItem.quantity + 1;
        db.updateCartQuantity(user.id, productId, newQuantity);
        
        await ctx.answerCallbackQuery(`✅ Количество увеличено до ${newQuantity} шт.`);
        
        // Обновляем сообщение корзины
        // await ctx.deleteMessage();
        // await showCart(ctx);
    } catch (error) {
        console.error('Error increasing cart quantity:', error);
        await ctx.answerCallbackQuery('❌ Ошибка при изменении количества');
    }
}

export async function handleCartDecrease(ctx) {
    try {
        const productId = parseInt(ctx.callbackQuery.data.split(':')[1]);
        const user = db.getUser(ctx.from.id);
        
        const cartItem = db.getCartItem(user.id, productId);
        
        if (!cartItem) {
            await ctx.answerCallbackQuery('❌ Товар не найден в корзине');
            return;
        }

        if (cartItem.quantity <= 1) {
            handleRemoveFromCart(ctx);
            //await ctx.answerCallbackQuery('❌ Минимальное количество: 1 шт.');
            return;
        }

        // Уменьшаем количество
        const newQuantity = cartItem.quantity - 1;
        db.updateCartQuantity(user.id, productId, newQuantity);
        
        await ctx.answerCallbackQuery(`✅ Количество уменьшено до ${newQuantity} шт.`);
        
        // Обновляем сообщение корзины
        // await ctx.deleteMessage();
        // await showCart(ctx);
    } catch (error) {
        console.error('Error decreasing cart quantity:', error);
        await ctx.answerCallbackQuery('❌ Ошибка при изменении количества');
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
            await ctx.conversation.enter('checkoutFromCart');
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        await ctx.reply('❌ Произошла ошибка при оформлении заказа');
    }
}