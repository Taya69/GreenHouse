import { Keyboard, InlineKeyboard } from 'grammy';

export function getCatalogNavigationKeyboard(product = null, categoryId = null) {
    const keyboard = []; 
    if (product) {
        keyboard.push([
            
        ]);
    }
    // Кнопки навигации
    const navButtons = [];   

    
    navButtons.push(InlineKeyboard.text('➖', `cart_decrease_in_product:${product.id}`));  
    navButtons.push(InlineKeyboard.text('🛒 Корзина', 'show_cart'));
    navButtons.push(InlineKeyboard.text('➕', `cart_increase_in_product:${product.id}`));
      

    keyboard.push(navButtons);

    const navButtons2 = [];

    if (product.image_url) {
        navButtons2.push(
            InlineKeyboard.webApp('🖼️ Посмотреть с фото', product.image_url)
        );
    }
    
    navButtons2.push(InlineKeyboard.text('📂 Категории', 'show_categories')); 
    
    navButtons2.push(
        InlineKeyboard.text('🏠 Главное меню', 'main_menu')
    );    

    keyboard.push(navButtons2);

    return InlineKeyboard.from(keyboard);
}

export function getAdminProductKeyboard(product, newAvailability) {
    const keyboard = [];
    const availabilityIcon = newAvailability ? '✅' : '❌';
    // Кнопки изменения количества для администратора
    keyboard.push([
        InlineKeyboard.text('➖', `admin_decrease_stock:${product.id}`),
        InlineKeyboard.text(`📦 ${product.stock}`, 'noop'),
        InlineKeyboard.text('➕', `admin_increase_stock:${product.id}`)
    ]);
    
    // Обычные кнопки для пользователей
    keyboard.push([
        InlineKeyboard.text('➖', `cart_decrease_in_product:${product.id}`),        
        InlineKeyboard.text('🛒 Корзина', 'show_cart'),
        InlineKeyboard.text('➕', `cart_increase_in_product:${product.id}`)              
    ]);

    // Кнопки навигации
    const navButtons = [];
  
    navButtons.push(InlineKeyboard.text('📂 Категории', 'show_categories'));    
    
    navButtons.push(
        InlineKeyboard.text('🏠 Главное меню', 'admin_menu')
    );
    keyboard.push(navButtons);
    
    // Кнопки администратора
    const navButtons2 = [];
    navButtons2.push(
        InlineKeyboard.text('✏️', `admin_edit_product:${product.id}`)
    );
    navButtons2.push(
        InlineKeyboard.text('🗑️', `admin_delete_product:${product.id}`)
    );
    navButtons2.push(
        InlineKeyboard.text(`${availabilityIcon} ${newAvailability ? 'Доступен' : 'Скрыт'}`, `toggle_availability:${product.id}`)
    )
    
    if (product.image_url) {
        navButtons2.push(
            InlineKeyboard.webApp('🖼️ Посмотреть', product.image_url)
        );
    }
    keyboard.push(navButtons2);

    return InlineKeyboard.from(keyboard);
}