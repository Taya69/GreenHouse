import { InlineKeyboard } from 'grammy';
import config from '../config.js';

export function getUserOrderStatusKeyboard() {
    return InlineKeyboard.from([
        [
            InlineKeyboard.text('📝 Создан', 'user_filter_status:created'),
            InlineKeyboard.text('✅ Принят', 'user_filter_status:accepted')
        ],
        [
            InlineKeyboard.text('🚚 Исполнен', 'user_filter_status:completed'),
            InlineKeyboard.text('❌ Отклонён', 'user_filter_status:rejected')
        ],
        [
            InlineKeyboard.text('🚫 Отменён', 'user_filter_status:cancelled')
        ],
        [
            InlineKeyboard.text('📋 Все заказы', 'user_filter_status:all')
        ],
        [
            InlineKeyboard.text('🏠 Главное меню', 'main_menu')
        ]
    ]);
}

export function getUserOrderKeyboard(orderId, status) {
    const keyboard = [];
    
    // Показываем кнопку отмены только для заказов в статусе "создан" или "принят"
    if (status === 'created' || status === 'accepted') {
        keyboard.push([
            InlineKeyboard.text('❌ Отменить заказ', `user_cancel_order:${orderId}`)
        ]);
    }
    
    keyboard.push([
        InlineKeyboard.text('🏠 Главное меню', 'main_menu')
    ]);
    
    return InlineKeyboard.from(keyboard);
}
