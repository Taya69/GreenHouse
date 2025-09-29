import { Bot, session } from 'grammy';
import db from './database.js';
import { conversations, createConversation } from '@grammyjs/conversations';
import config from './config.js';
import * as dotenv from 'dotenv';

// Импортируем обработчики
import { 
    handleStart, 
    // handleStartButton, 
    handleMainMenu 
} from './handlers/start.js';

import {
    showCatalog,
    handleAddToCart
} from './handlers/catalog.js';

import {
    showCart,
    handleClearCart,
    handleCheckout,   
    handleCartIncreaseInProduct,
    handleCartDecreaseInProduct,
    handleCartIncreaseInCart,
    handleCartDecreaseInCart
} from './handlers/cart.js';

import { showUserOrders, handleUserOrderStatusFilter, handleUserCancelOrder } from './handlers/orders.js';

import {
    showAdminPanel,
    showAdminStats,
    showAllOrders,
    showOrdersByStatus,
    handleOrderStatusChange, 
    handleAddProduct,
    handleInlineDeleteProduct,
    handleInlineEditProduct,
    handleAddProductCategory,
    showAdminCategories,
    handleInlineEditCategory,
    handleInlineDeleteCategory,
    handleIncreaseStock,
    handleDecreaseStock,
    handleAddCategory,
    showAdminOrdersByStatus,
    showUsers
} from './handlers/admin.js';

import {
    addProduct,
    addProductCategory,
    getContactInfo,
    checkoutFromCart,
    editProduct,
    updateOrderStatus,
    editCategory
} from './handlers/conversations.js';

import { getMainKeyboard } from './keyboards/main.js';
import { isAdmin } from './utils/helpers.js';
import { getAdminKeyboard } from './keyboards/admin.js';
import { getCategoriesKeyboard } from './keyboards/categories.js';


dotenv.config();

// Инициализация бота
export const bot = new Bot(process.env.BOT_API_KEY);

// Bot commands (menus)
const userCommands = [
    { command: 'menu', description: 'Главное меню' },
    { command: 'catalog', description: 'Каталог товаров' },
    { command: 'cart', description: 'Корзина' },
    { command: 'orders', description: 'Мои заказы' }
];

const adminCommands = [
    { command: 'admin', description: 'Главное меню' },
    { command: 'catalog', description: 'Каталог товаров' },
    // { command: 'cart', description: 'Корзина' },
    { command: 'orders_by_status', description: 'Заказы по статусу' },    
    { command: 'orders_all', description: 'Все заказы' },    
    { command: 'add_product', description: 'Добавить товар' },
    { command: 'add_category', description: 'Добавить категорию' },
    { command: 'users', description: 'Пользователи' },
    { command: 'stats', description: 'Статистика' },
];

async function setCommandsForUser(ctx) {
    try {
        const commands = isAdmin(ctx.from.id) ? adminCommands : userCommands;
        await bot.api.setMyCommands(commands, { scope: { type: 'chat', chat_id: ctx.chat.id } });
    } catch (e) {
        console.error('Failed to set commands:', e);
    }
}

// Middleware
bot.use(session({
    initial: () => ({
        cartItems: [],
        editingOrder: {},
        editingProductId: null
    })
}));

// Conversations
bot.use(conversations());
bot.use(createConversation(addProduct));
bot.use(createConversation(addProductCategory));
bot.use(createConversation(getContactInfo));
bot.use(createConversation(checkoutFromCart));
bot.use(createConversation(editProduct));
bot.use(createConversation(editCategory));
bot.use(createConversation(updateOrderStatus));

// Клавиатуры

bot.use(getMainKeyboard());
bot.use(getAdminKeyboard());

// Команды
bot.command('start', async (ctx) => { await setCommandsForUser(ctx); return handleStart(ctx); });
bot.command('menu', async (ctx) => { await setCommandsForUser(ctx); return handleMainMenu(ctx); });
bot.command('catalog', async (ctx) => {
    await ctx.reply("Выберите категорию товаров:", { reply_markup: getCategoriesKeyboard() });
});
bot.command('cart', showCart);
bot.command('orders', showUserOrders);
bot.command('admin', showAdminPanel);
bot.command('stats', showAdminStats);
bot.command('orders_all', showAllOrders);
bot.command('orders_by_status', showAdminOrdersByStatus);
bot.command('categories', showAdminCategories);
bot.command('add_product', handleAddProduct);
bot.command('add_category', handleAddProductCategory);
bot.command('users', showUsers);

// Текстовые сообщения
// bot.hears('🚀 Start', handleStartButton);
// bot.hears('🛍️ Каталог', (ctx) => showCatalog(ctx, 0));
// bot.hears('🛒 Корзина', showCart);
// bot.hears('📦 Мои заказы', showUserOrders);
// bot.hears('👑 Админ панель', showAdminPanel);
// bot.hears('⬅️ Главное меню', handleMainMenu);
// bot.hears('📊 Статистика', showAdminStats);
// bot.hears('📦 Заказы', showAllOrders);
// bot.hears('➕ Добавить товар', handleAddProduct);
// bot.hears('➕ Добавить категорию', handleAddProductCategory);
// bot.hears('⬅️ Назад', handleMainMenu);

// Callback queries
bot.callbackQuery('main_menu', handleMainMenu);
bot.callbackQuery('start_shopping', handleMainMenu);
bot.callbackQuery('admin_menu', showAdminPanel);
bot.callbackQuery('show_cart', async (ctx) => {
    await ctx.deleteMessage();
    await showCart(ctx);
});
bot.callbackQuery('show_categories', async (ctx) => {
               // await showCatalog(ctx);
               await ctx.reply("Выберите категорию товаров:", {
                   reply_markup: getCategoriesKeyboard()
               });
           });
bot.callbackQuery(/^add_to_cart:/, handleAddToCart);
// bot.callbackQuery(/^catalog_page:/, handleCatalogNavigation);
// bot.callbackQuery(/^remove_from_cart:/, handleRemoveFromCart);
bot.callbackQuery(/^cart_increase:/, handleCartIncreaseInCart);
bot.callbackQuery(/^cart_decrease:/, handleCartDecreaseInCart);
bot.callbackQuery(/^cart_increase_in_product:/, handleCartIncreaseInProduct);
bot.callbackQuery(/^cart_decrease_in_product:/, handleCartDecreaseInProduct);
bot.callbackQuery('clear_cart', handleClearCart);
bot.callbackQuery('checkout', handleCheckout);
bot.callbackQuery(/^user_filter_status:/, handleUserOrderStatusFilter);
bot.callbackQuery(/^user_cancel_order:/, handleUserCancelOrder);

bot.callbackQuery('noop', (ctx) => ctx.answerCallbackQuery()); // Обработчик для кнопки с количеством
bot.callbackQuery(/category_(\d+)/, showCatalog); 

bot.callbackQuery(/^admin_set_status:/, handleOrderStatusChange);
bot.callbackQuery(/^admin_delete_product:/, handleInlineDeleteProduct);
bot.callbackQuery(/^admin_edit_product:/, handleInlineEditProduct);
bot.callbackQuery('admin_add_category', handleAddCategory);
bot.callbackQuery(/^admin_delete_category:/, handleInlineDeleteCategory);
bot.callbackQuery(/^admin_edit_category:/, handleInlineEditCategory);
bot.callbackQuery(/^admin_increase_stock:/, handleIncreaseStock);
bot.callbackQuery(/^admin_decrease_stock:/, handleDecreaseStock);
bot.callbackQuery(/^admin_filter_status:(.*)$/, async (ctx) => {
    const status = ctx.match[1];
    ctx.session.filterStatus = status;
    await ctx.deleteMessage().catch(() => {});
    await showOrdersByStatus(ctx);
});


// Обработка неизвестных команд
bot.on('message', async (ctx) => {
    const user = db.getUser(ctx.from.id);
    if (!user && !ctx.message.text.startsWith('/')) {
        await db.createUser(ctx.from);
        await handleStart(ctx);
        return;
    }
    
    await ctx.reply('Не понимаю эту команду. Используйте меню:', {
        reply_markup: getMainKeyboard(isAdmin(ctx.from.id))
    });
});

// Обработка ошибок
bot.catch((err) => {
    console.error('Bot error:', err);
});

// Запуск бота
bot.start();
console.log('🤖 Бот GreenHouse запущен!');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Остановка бота...');
    db.close();
    process.exit(0);
});

