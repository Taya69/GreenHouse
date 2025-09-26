import { Keyboard, InlineKeyboard } from 'grammy';

// export function getCatalogNavigationKeyboard(page, totalPages, productId = null) {
//     const keyboard = [];

//     if (productId) {
//         keyboard.push([
//             InlineKeyboard.text('➕ Добавить в корзину', `add_to_cart:${productId}`)
//         ]);
//     }

//     const navigation = [];
//     if (page > 0) {
//         navigation.push(InlineKeyboard.text('⬅️ Назад', `catalog_page:${page - 1}`));
//     }
//     if (page < totalPages - 1) {
//         navigation.push(InlineKeyboard.text('Вперед ➡️', `catalog_page:${page + 1}`));
//     }
    
//     if (navigation.length > 0) {
//         keyboard.push(navigation);
//     }

//     keyboard.push([
//         InlineKeyboard.text('🛒 Корзина', 'show_cart'),
//         InlineKeyboard.text('🏠 Главное меню', 'main_menu')
//     ]);

//     return InlineKeyboard.from(keyboard);
// }

export function getCatalogNavigationKeyboard(productId = null, categoryId = null) {
    const keyboard = []; 
    if (productId) {
        keyboard.push([
            InlineKeyboard.text('➕ Добавить в корзину', `add_to_cart:${productId}`)
        ]);
    }

    // Кнопки навигации
    const navButtons = [];
    if (categoryId) {
        navButtons.push(InlineKeyboard.text('📂 Все категории', 'show_categories'));
    } else {
        navButtons.push(InlineKeyboard.text('📂 Категории', 'show_categories'));
    }
    navButtons.push(InlineKeyboard.text('🛒 Корзина', 'show_cart'));
    
    keyboard.push(navButtons);
    keyboard.push([
        InlineKeyboard.text('🏠 Главное меню', 'main_menu')
    ]);

    return InlineKeyboard.from(keyboard);
}

export function getProductKeyboard(productId) {
    return InlineKeyboard.from([
        [
            InlineKeyboard.text('➕ Добавить в корзину', `add_to_cart:${productId}`),
            InlineKeyboard.text('🛒 В корзину', 'show_cart')
        ],
        [
            InlineKeyboard.text('⬅️ Назад к каталогу', 'back_to_catalog'),
            InlineKeyboard.text('🏠 Главное меню', 'main_menu')
        ]
    ]);
}