import { Bot, Keyboard, InlineKeyboard, session } from 'grammy';
import db from './database.js';
import { Menu } from '@grammyjs/menu';
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
    handleAddToCart,
    handleCatalogNavigation,
    handleBackToCatalog
} from './handlers/catalog.js';

import {
    showCart,
    handleRemoveFromCart,
    handleClearCart,
    handleCheckout
} from './handlers/cart.js';

import { showUserOrders } from './handlers/orders.js';

import {
    showAdminPanel,
    showAdminStats,
    showAllOrders,
    handleOrderStatusChange,
    showAdminProducts,
    handleAddProduct,
    handleDeleteProduct,
    handleAddProductCategory
} from './handlers/admin.js';

import {
    addProduct,
    addProductCategory,
    getContactInfo,
    updateOrderStatus
} from './handlers/conversations.js';

import { getMainKeyboard } from './keyboards/main.js';
import { isAdmin } from './utils/helpers.js';
import { getAdminKeyboard } from './keyboards/admin.js';
import { getCategoriesKeyboard } from './keyboards/categories.js';


dotenv.config();

// Инициализация бота
export const bot = new Bot(process.env.BOT_API_KEY);

// Middleware
bot.use(session({
    initial: () => ({
        cartItems: [],
        editingOrder: {}
    })
}));

// Conversations
bot.use(conversations());
bot.use(createConversation(addProduct));
bot.use(createConversation(addProductCategory));
// bot.use(addProduct);
bot.use(createConversation(getContactInfo));
// bot.use(getContactInfo);
bot.use(createConversation(updateOrderStatus));
// bot.use(updateOrderStatus);
// bot.use(createConversation(createOrder));


// Клавиатуры

bot.use(getMainKeyboard());
bot.use(getAdminKeyboard());

// Команды
bot.command('start', handleStart);
bot.command('menu', handleMainMenu);
bot.command('delete_product', handleDeleteProduct);

// Текстовые сообщения
// bot.hears('🚀 Start', handleStartButton);
bot.hears('🛍️ Каталог', (ctx) => showCatalog(ctx, 0));
bot.hears('🛒 Корзина', showCart);
bot.hears('📦 Мои заказы', showUserOrders);
bot.hears('👑 Админ панель', showAdminPanel);
bot.hears('⬅️ Главное меню', handleMainMenu);
bot.hears('📊 Статистика', showAdminStats);
bot.hears('📦 Заказы', showAllOrders);
bot.hears('🛍️ Товары', showAdminProducts);
bot.hears('➕ Добавить товар', handleAddProduct);
bot.hears('➕ Добавить категорию', handleAddProductCategory);
bot.hears('⬅️ Назад', handleMainMenu);



// Callback queries
bot.callbackQuery('main_menu', handleMainMenu);
bot.callbackQuery('start_shopping', handleMainMenu);
bot.callbackQuery('admin_menu', showAdminPanel);

bot.callbackQuery('back_to_catalog', async (ctx) => {
    await ctx.deleteMessage();
    await showCatalog(ctx, 0);
});

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
bot.callbackQuery(/^catalog_page:/, handleCatalogNavigation);
bot.callbackQuery(/^remove_from_cart:/, handleRemoveFromCart);
bot.callbackQuery('clear_cart', handleClearCart);
bot.callbackQuery('checkout', handleCheckout);
bot.callbackQuery(/^admin_set_status:/, handleOrderStatusChange);
bot.callbackQuery(/category_(\d+)/, showCatalog); 


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

