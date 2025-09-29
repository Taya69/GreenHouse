import { InlineKeyboard } from 'grammy';

export function getCartKeyboard(cartItems) {
    const keyboard = [];

    // Кнопки для каждого товара с возможностью изменения количества
    cartItems.forEach(item => {
        keyboard.push([
            InlineKeyboard.text(`${item.name.substring(0, 15)}`, `cart_item:${item.product_id}`),
            InlineKeyboard.text('➖', `cart_decrease:${item.product_id}`),
            InlineKeyboard.text(`${item.quantity}`, 'noop'),
            InlineKeyboard.text('➕', `cart_increase:${item.product_id}`)
        ]); 
    });

    // Основные действия
    keyboard.push([
        InlineKeyboard.text('🗑️ Очистить корзину', 'clear_cart'),
        // InlineKeyboard.text('🔄 Обновить корзину', 'update_cart')
    ]);
    keyboard.push([
        InlineKeyboard.text('✅ Оформить заказ', 'checkout')
    ]);

    keyboard.push([
        InlineKeyboard.text('🛍️ Продолжить покупки', 'show_categories'),
        InlineKeyboard.text('🏠 Главное меню', 'main_menu')
    ]);

    return InlineKeyboard.from(keyboard);
}