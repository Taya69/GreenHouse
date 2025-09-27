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

export function getCatalogNavigationKeyboard(product = null, categoryId = null) {
    const keyboard = []; 
    if (product) {
        keyboard.push([
            InlineKeyboard.text('➕ Добавить в корзину', `add_to_cart:${product.id}`)
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
    ])
    if (product.image_url) {
        keyboard.push([
            InlineKeyboard.webApp('🖼️ Посмотреть с фото', product.image_url)
        ]);
    }

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

export function getAdminProductKeyboard(product, categoryId = null) {
    const keyboard = [];
    
    // Кнопки изменения количества для администратора
    keyboard.push([
        InlineKeyboard.text('➖', `admin_decrease_stock:${product.id}`),
        InlineKeyboard.text(`📦 ${product.stock}`, 'noop'),
        InlineKeyboard.text('➕', `admin_increase_stock:${product.id}`)
    ]);
    
    // Обычные кнопки для пользователей
    keyboard.push([
        InlineKeyboard.text('➕ Добавить в корзину', `add_to_cart:${product.id}`)
    ]);

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
    
    // Кнопки администратора
    keyboard.push([
        InlineKeyboard.text('✏️ Редактировать', `admin_edit_product:${product.id}`),
        InlineKeyboard.text('🗑️ Удалить', `admin_delete_product:${product.id}`)
    ]);
    
    if (product.image_url) {
        keyboard.push([
            InlineKeyboard.webApp('🖼️ Посмотреть с фото', product.image_url)
        ]);
    }

    return InlineKeyboard.from(keyboard);
}