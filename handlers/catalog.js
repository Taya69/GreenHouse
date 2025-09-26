import db from '../database.js';
import { InputFile } from 'grammy';
import { getCatalogNavigationKeyboard, getProductKeyboard } from '../keyboards/catalog.js';
import { getMainKeyboard } from '../keyboards/main.js';
import config from '../config.js';
import { isAdmin } from '../utils/helpers.js';
import { resizeImageFromUrl, safeUnlink } from '../utils/image.js';

export async function showCatalog(ctx, page = 0) {
    try {
        const data = ctx.callbackQuery.data;
        const categoryId = parseInt(data.split('_')[1]);

        const products = isAdmin(ctx.from.id) ? db.getProductsAny(categoryId) : db.getProducts(categoryId);
        // const pagination = paginateArray(products, 1, config.PRODUCTS_PER_PAGE);
            
            // Показываем заголовок с категорией
            await ctx.reply(`📂 ** (${products.length} товаров)`, {
                parse_mode: 'Markdown'
            });
            for (const product of products) {
                let message = `🎁 *${product.name}*\n`;
                message += `💰 Цена: ${product.price} руб.\n`;
                message += `📦 В наличии: ${product.stock} шт.\n`;
                if (product.category_name) {
                    message += `📂 Категория: ${product.category_name}\n`;
                }
                message += `📝 ${product.description}\n\n`;

                const keyboard = getCatalogNavigationKeyboard(product.id, categoryId);
                if (isAdmin(ctx.from.id)) {
                    keyboard.add(
                        { text: '✏️ Редактировать', callback_data: `admin_edit_product:${product.id}` },
                        { text: '🗑️ Удалить', callback_data: `admin_delete_product:${product.id}` }
                    );
                }

                if (product.image_url) {
                    try {
                        const resizedPath = await resizeImageFromUrl(product.image_url, 320);
                        await ctx.replyWithPhoto(new InputFile(resizedPath), {
                            caption: message,
                            parse_mode: 'Markdown',
                            reply_markup: keyboard
                        });
                        await safeUnlink(resizedPath);
                    } catch (e) {
                        console.error('Image resize failed, sending original:', e);
                        await ctx.replyWithPhoto(product.image_url, {
                            caption: message,
                            parse_mode: 'Markdown',
                            reply_markup: keyboard
                        });
                    }
                } else {
                    await ctx.reply(message, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                }
            }

    } catch (error) {
        console.error('Error showing catalog:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке каталога');
    }
}

export async function showProductCategories(ctx, page = 0) {
    try {
        const categories = db.getProductCategories();
        
        if (categories.length === 0) {
            await ctx.reply('😔 В каталоге пока нет категорий');
            return;
        }
        
        for (const сategory of categories) {
            let message = `🎁 *${сategory.name}*\n`;

            const keyboard = getCatalogNavigationKeyboard(сategory.id);

            await ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            
        }
       
    } catch (error) {
        console.error('Error showing categories:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке категорий');
    }
}

export async function handleAddToCart(ctx) {
    try {
        const productId = ctx.callbackQuery.data.split(':')[1];
        const user = db.getUser(ctx.from.id);
        const product = db.getProductById(parseInt(productId));
        
        if (!product) {
            await ctx.answerCallbackQuery('❌ Товар не найден');
            return;
        }

        const cartItem = db.getCartItem(user.id, product.id);
        
        if (cartItem && cartItem.quantity >= product.stock) {
            await ctx.answerCallbackQuery('❌ Недостаточно товара на складе');
            return;
        }
        
        await db.addToCart(user.id, product.id);
        const updatedCartItem = db.getCartItem(user.id, product.id);
        
        await ctx.answerCallbackQuery(`✅ Добавлено в корзину (${updatedCartItem.quantity} шт.)`);
    } catch (error) {
        console.error('Error adding to cart:', error);
        await ctx.answerCallbackQuery('❌ Ошибка при добавлении в корзину');
    }
}

export async function handleCatalogNavigation(ctx) {
    const page = parseInt(ctx.callbackQuery.data.split(':')[1]);
    await ctx.deleteMessage();
    await showCatalog(ctx, page);
}

export async function handleBackToCatalog(ctx) {
    await ctx.deleteMessage();
    await showCatalog(ctx);
}