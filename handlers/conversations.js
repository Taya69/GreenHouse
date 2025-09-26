import db from '../database.js';
import config from '../config.js';
import { getCategoriesInlineKeyboard } from '../keyboards/categories.js';

export async function addProduct(conversation, ctx) {
    await ctx.reply('🎁 Введите название товара:');
    const name = await conversation.wait();
    
    await ctx.reply('📝 Введите описание товара:');
    const description = await conversation.wait();
    
    await ctx.reply('💰 Введите цену товара (только число):');
    const priceMsg = await conversation.wait();
    const price = parseFloat(priceMsg.message.text);
    
    if (isNaN(price)) {
        await ctx.reply('❌ Пожалуйста, введите корректную цену (число)');
        return;
    }

    await ctx.reply('📂 Выберите категорию из списка:', {
        reply_markup: getCategoriesInlineKeyboard()
    });
    let categoryId;
    let categoryName;
    while (true) {
        const categoryCtx = await conversation.wait();
 
        // Обработка inline кнопок категорий
        if (categoryCtx.callbackQuery) {
            const data = categoryCtx.callbackQuery.data;  
            console.log(data);
            if (data.startsWith('select_category:')) {
                categoryId = parseInt(data.split(':')[1]);  
                console.log(categoryId);  
                const category = db.getProductCategoryById(categoryId);
                categoryName = category.name;
                await categoryCtx.answerCallbackQuery(`Выбрана категория: ${categoryName}`);
                break;
            } else if (data === 'cancel_add_product') {
                await categoryCtx.answerCallbackQuery('Добавление товара отменено');
                await ctx.reply('❌ Добавление товара отменено.');
                return;
            }
        } 
     
    }   

    
    await ctx.reply('🖼️ Введите URL изображения (или отправьте "нет"):');
    const imageUrl = await conversation.wait();
    
    await ctx.reply('📦 Введите количество на складе (только число):');
    const stockMsg = await conversation.wait();
    const stock = parseInt(stockMsg.message.text);

    if (isNaN(stock)) {
        await ctx.reply('❌ Пожалуйста, введите корректное количество (число)');
        return;
    } 

    try {
        const productData = {
            name: name.message.text,
            description: description.message.text,
            price: price,
            category_id: categoryId,
            image_url: imageUrl.message.text.toLowerCase() === 'нет' ? null : imageUrl.message.text,
            stock: stock
        };

        const productId = db.addProduct(productData);
 
        await ctx.reply(`✅ Товар "${productData.name}" успешно добавлен! ID: ${productId}`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: 'Вернуться в меню', callback_data: 'admin_menu' }]] }
    })
    } catch (error) {
        console.error('Error adding product:', error);
        await ctx.reply('❌ Произошла ошибка при добавлении товара');
    }
}

export async function addProductCategory(conversation, ctx) {
    await ctx.reply('🎁 Введите название категории:');
    const name = await conversation.wait();
    
   
    try {
        const categoryData = {
            name: name.message.text           
        };

        const categoryId = db.addProductCategory(categoryData);

          await ctx.reply(`✅ Категория "${categoryData.name}" успешно добавлена! ID: ${categoryId}`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: 'Вернуться в меню', callback_data: 'admin_menu' }]] }
    })
    } catch (error) {
        console.error('Error adding category:', error);
        await ctx.reply('❌ Произошла ошибка при добавлении категории');

    }
}

export async function getContactInfo(conversation, ctx) {
    await ctx.reply('📞 Пожалуйста, введите ваш номер телефона:');
    const phoneMsg = await conversation.wait();
    const phone = phoneMsg.message.text;
    
    await ctx.reply('👤 Пожалуйста, введите ваше полное имя:');
    const nameMsg = await conversation.wait();
    const fullName = nameMsg.message.text;
    
    db.updateUserContact(ctx.from.id, phone, fullName);
    
    await ctx.reply('✅ Контактная информация сохранена!');
    
    // Продолжаем оформление заказа
    const user = db.getUser(ctx.from.id);
    const cartItems = ctx.session.cartItems || [];
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await createOrder(conversation, ctx, user.id, cartItems, totalAmount);
}

async function createOrder(conversation, ctx, userId, cartItems, totalAmount) {
    await ctx.reply('💬 Хотите добавить комментарий к заказу? (Если нет, отправьте "нет")');
    
    const commentMsg = await conversation.wait();
    const userComment = commentMsg.message.text.toLowerCase() === 'нет' ? '' : commentMsg.message.text;
    
    try {
        const orderId = db.createOrder(userId, cartItems, totalAmount, userComment);
        db.clearCart(userId);
        
        await ctx.reply(
            `✅ Заказ #${orderId} оформлен успешно!\n` +
            `💵 Сумма: ${totalAmount} руб.\n` +
            `📊 Статус: ${config.ORDER_STATUSES.CREATED}`
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

export async function updateOrderStatus(conversation, ctx) {
    const { orderId, status } = ctx.session.editingOrder;
    
    await ctx.reply(`Введите комментарий для статуса "${status}":`);
    const commentMsg = await conversation.wait();
    const adminComment = commentMsg.message.text;
    
    db.updateOrderStatus(orderId, status, adminComment);
    
    await ctx.reply(`✅ Статус заказа #${orderId} изменен на "${status}"`);
    
    // Уведомляем пользователя
    const order = db.getOrderById(orderId);
    if (order) {
        const user = db.getUser(order.user_id);
        if (user) {
            try {
                await ctx.api.sendMessage(
                    user.telegram_id,
                    `📦 Статус вашего заказа #${orderId} изменен на "${status}"\n💬 Комментарий администратора: ${adminComment}`
                );
            } catch (error) {
                console.error('Error notifying user:', error);
            }
        }
    }
}