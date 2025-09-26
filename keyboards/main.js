import { Keyboard } from 'grammy';
import { Menu } from '@grammyjs/menu';
import { getCategoriesKeyboard } from './categories.js';
import { showCart } from '../handlers/cart.js';
import { showUserOrders } from '../handlers/orders.js';

// Главное меню
const mainMenu = new Menu('main-menu')
    .text('🛍️ Каталог', async (ctx) => {
        // await showCatalog(ctx);
        await ctx.reply("Выберите категорию товаров:", {
            reply_markup: getCategoriesKeyboard()
        });
    })
    .row()
    .text('🛒 Корзина', async (ctx) => {
        await showCart(ctx);
    })
    .text('📦 Мои заказы', async (ctx) => {
        await showUserOrders(ctx);
    })
    .row();

export function getMainKeyboard() {
    // let keyboard = [
    //     ['🛍️ Каталог', '🛒 Корзина'],
    //     ['📦 Мои заказы']
    // ];

    // if (isAdmin) {
    //     keyboard.push(['👑 Админ панель']);
    // }

    // return Keyboard.keyboard(keyboard).resize();
    return mainMenu;
}

// export function getStartKeyboard() {
//     return Keyboard.keyboard([
//         ['🚀 Start']
//     ]).resize().oneTime();
// }

export function getBackKeyboard() {
    return Keyboard.keyboard([
        ['⬅️ Назад']
    ]).resize();
}