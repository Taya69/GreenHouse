import db from '../database.js';
import config from '../config.js';
import { getCategoriesInlineKeyboard } from '../keyboards/categories.js';

function isCancelText(text) {
    if (!text) return false;
    const t = text.trim().toLowerCase();
    return t === 'отмена' || t === 'cancel' || t === 'стоп';
}

export async function addProduct(conversation, ctx) {
    await ctx.reply('🎁 Введите название товара (или отправьте "отмена" для отмены):');
    const name = await conversation.wait();
    if (name.message && isCancelText(name.message.text)) {
        await ctx.reply('❌ Добавление товара отменено.');
        return;
    }
    
    await ctx.reply('📝 Введите описание товара (или отправьте "отмена" для отмены):');
    const description = await conversation.wait();
    if (description.message && isCancelText(description.message.text)) {
        await ctx.reply('❌ Добавление товара отменено.');
        return;
    }
    
    await ctx.reply('💰 Введите цену товара (только число, или "отмена" для отмены):');
    const priceMsg = await conversation.wait();
    if (priceMsg.message && isCancelText(priceMsg.message.text)) {
        await ctx.reply('❌ Добавление товара отменено.');
        return;
    }
    const price = parseFloat(priceMsg.message.text);
    
    if (isNaN(price)) {
        await ctx.reply('❌ Пожалуйста, введите корректную цену (число)');
        return;
    }

    await ctx.reply('📂 Выберите категорию из списка (или отправьте "отмена" для отмены):', {
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
        } else if (categoryCtx.message && isCancelText(categoryCtx.message.text)) {
            await ctx.reply('❌ Добавление товара отменено.');
            return;
        }
     
    }   

    
    await ctx.reply('🖼️ Введите URL изображения (или отправьте "нет", либо "отмена" для отмены):');
    const imageUrl = await conversation.wait();
    if (imageUrl.message && isCancelText(imageUrl.message.text)) {
        await ctx.reply('❌ Добавление товара отменено.');
        return;
    }
    
    await ctx.reply('📦 Введите количество на складе (только число, или "отмена" для отмены):');
    const stockMsg = await conversation.wait();
    if (stockMsg.message && isCancelText(stockMsg.message.text)) {
        await ctx.reply('❌ Добавление товара отменено.');
        return;
    }
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
    await ctx.reply('🎁 Введите название категории (или отправьте "отмена" для отмены):');
    const name = await conversation.wait();
    if (name.message && isCancelText(name.message.text)) {
        await ctx.reply('❌ Добавление категории отменено.');
        return;
    }
    
   
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
    
    // Продолжаем оформление заказа (после сохранения контактов сразу переходим к оформлению)
    await checkoutFromCart(conversation, ctx);
}

export async function checkoutFromCart(conversation, ctx) {
    const user = db.getUser(ctx.from.id);
    const cartItems = db.getCart(user.id);

    if (!cartItems || cartItems.length === 0) {
        await ctx.reply('🛒 Ваша корзина пуста');
        return;
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await ctx.reply('💬 Хотите добавить комментарий к заказу? (Если нет, отправьте "нет")');

    const commentMsg = await conversation.wait();
    const userComment = commentMsg.message.text && commentMsg.message.text.toLowerCase() === 'нет' ? '' : commentMsg.message.text;

    try {
        const orderId = db.createOrder(user.id, cartItems, totalAmount, userComment);
        db.clearCart(user.id);

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

export async function editProduct(conversation, ctx) {
    let productId = (conversation.session && conversation.session.editingProductId) || (ctx.session && ctx.session.editingProductId);
    if (!productId && ctx.callbackQuery && ctx.callbackQuery.data) {
        const m = ctx.callbackQuery.data.match(/^admin_edit_product:(\d+)/);
        if (m) productId = parseInt(m[1]);
    }
    if (!productId) {
        await ctx.reply('Введите ID товара для редактирования:');
        const idMsg = await conversation.wait();
        const parsed = parseInt(idMsg.message.text);
        if (Number.isNaN(parsed)) {
            await ctx.reply('❌ Некорректный ID');
            return;
        }
        productId = parsed;
    }
    conversation.session = conversation.session || {};
    conversation.session.editingProductId = productId;

    const product = db.getAllProducts().find(p => p.id === productId) || db.getProductById(productId);
    if (!product) {
        await ctx.reply('❌ Товар не найден');
        return;
    }

    await ctx.reply('✏️ Введите новое название (или "-" чтобы оставить без изменений):');
    const nameMsg = await conversation.wait();
    const newName = nameMsg.message.text.trim();

    await ctx.reply('📝 Новое описание (или "-" чтобы пропустить):');
    const descMsg = await conversation.wait();
    const newDesc = descMsg.message.text.trim();

    await ctx.reply('💰 Новая цена (число, или "-" чтобы пропустить):');
    const priceMsg = await conversation.wait();
    const priceText = priceMsg.message.text.trim();

    await ctx.reply('📂 Новый ID категории (число, или "-" чтобы пропустить):');
    const catMsg = await conversation.wait();
    const catText = catMsg.message.text.trim();

    await ctx.reply('🖼️ Новый URL изображения (или "-" чтобы пропустить):');
    const imgMsg = await conversation.wait();
    const imgText = imgMsg.message.text.trim();

    await ctx.reply('📦 Новое количество на складе (число, или "-" чтобы пропустить):');
    const stockMsg = await conversation.wait();
    const stockText = stockMsg.message.text.trim();

    await ctx.reply('🟢 Доступность товара (1/0, или "-" чтобы пропустить):');
    const availMsg = await conversation.wait();
    const availText = availMsg.message.text.trim();

    const updated = {
        name: newName === '-' ? product.name : newName,
        description: newDesc === '-' ? product.description : newDesc,
        price: priceText === '-' ? product.price : parseFloat(priceText),
        category_id: catText === '-' ? product.category_id : parseInt(catText),
        image_url: imgText === '-' ? product.image_url : imgText,
        stock: stockText === '-' ? product.stock : parseInt(stockText),
        is_available: availText === '-' ? product.is_available : parseInt(availText)
    };

    if (
        (priceText !== '-' && Number.isNaN(updated.price)) ||
        (catText !== '-' && Number.isNaN(updated.category_id)) ||
        (stockText !== '-' && Number.isNaN(updated.stock))
    ) {
        await ctx.reply('❌ Некорректные данные. Редактирование отменено.');
        return;
    }

    console.log('updated', updated);
    try {
        db.stmts.updateProduct.run(
            updated.name,
            updated.description,
            updated.price,
            updated.category_id,
            updated.image_url,
            updated.stock,
            updated.is_available,
            productId
        );
        await ctx.reply('✅ Товар обновлен');
    } catch (e) {
        console.error('Error updating product:', e);
        await ctx.reply('❌ Ошибка при обновлении товара');
    }
}

export async function editCategory(conversation, ctx) {
    let categoryId = (conversation.session && conversation.session.editingCategoryId) || (ctx.session && ctx.session.editingCategoryId);
    if (!categoryId && ctx.callbackQuery && ctx.callbackQuery.data) {
        const m = ctx.callbackQuery.data.match(/^admin_edit_category:(\d+)/);
        if (m) categoryId = parseInt(m[1]);
    }
    if (!categoryId) {
        await ctx.reply('Введите ID категории для редактирования:');
        const idMsg = await conversation.wait();
        const parsed = parseInt(idMsg.message.text);
        if (Number.isNaN(parsed)) {
            await ctx.reply('❌ Некорректный ID');
            return;
        }
        categoryId = parsed;
    }
    conversation.session = conversation.session || {};
    conversation.session.editingCategoryId = categoryId;

    const category = db.getProductCategoryById(categoryId);
    if (!category) {
        await ctx.reply('❌ Категория не найдена');
        return;
    }

    await ctx.reply(`Текущее название: "${category.name}"\nВведите новое название (или "отмена" для отмены):`);
    const nameMsg = await conversation.wait();
    if (nameMsg.message && isCancelText(nameMsg.message.text)) {
        await ctx.reply('❌ Редактирование отменено.');
        return;
    }
    const newName = nameMsg.message.text.trim();
    if (!newName) {
        await ctx.reply('❌ Пустое название. Редактирование отменено.');
        return;
    }

    try {
        const changed = db.updateProductCategory(categoryId, newName);
        if (changed > 0) {
            await ctx.reply('✅ Категория обновлена');
        } else {
            await ctx.reply('❌ Не удалось обновить категорию');
        }
    } catch (e) {
        console.error('Error updating category:', e);
        await ctx.reply('❌ Ошибка при обновлении категории');
    }
}

export async function updateOrderStatus(conversation, ctx) {
    // Safely get editingOrder from session or conversation, or parse from callback data
    let editingOrder = (ctx.session && ctx.session.editingOrder) || (conversation.session && conversation.session.editingOrder);

    if (!editingOrder || !editingOrder.orderId || !editingOrder.status) {
        if (ctx.callbackQuery && ctx.callbackQuery.data) {
            const m = ctx.callbackQuery.data.match(/^admin_set_status:(\d+):([a-zA-Z_]+)/);
            if (m) {
                editingOrder = { orderId: parseInt(m[1]), status: m[2] };
            }
        }
    }

    if (!editingOrder || !editingOrder.orderId || !editingOrder.status) {
        // Fallback prompt
        await ctx.reply('Введите ID заказа:');
        const idMsg = await conversation.wait();
        const parsedId = parseInt(idMsg.message?.text || '');
        if (Number.isNaN(parsedId)) {
            await ctx.reply('❌ Некорректный ID заказа');
            return;
        }
        await ctx.reply('Введите статус (created | accepted | completed | rejected):');
        const stMsg = await conversation.wait();
        const statusText = (stMsg.message?.text || '').trim().toLowerCase();
        editingOrder = { orderId: parsedId, status: statusText };
    }

    // Persist for future steps
    ctx.session = ctx.session || {};
    conversation.session = conversation.session || {};
    ctx.session.editingOrder = editingOrder;
    conversation.session.editingOrder = editingOrder;

    const { orderId, status } = editingOrder;

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