import { Keyboard, InlineKeyboard } from 'grammy';
import { showAdminProducts, showAdminStats, showAllOrders } from '../handlers/admin.js';
import { Menu } from '@grammyjs/menu';
import { getCategoriesKeyboard } from './categories.js';

const adminMenu = new Menu('admin-menu')
        .text('📊 Статистика', async (ctx) => {
            await showAdminStats(ctx);
        })
        .row()
        .text('📦 Заказы', async (ctx) => {
            await showAllOrders(ctx);
        })
        .text('🛍️ Каталог', async (ctx) => {
               // await showCatalog(ctx);
               await ctx.reply("Выберите категорию товаров:", {
                   reply_markup: getCategoriesKeyboard()
               });
           })
        .row()
        .text('➕ Добавить товар', async (ctx) => {
            await ctx.conversation.enter('addProduct');
        })
        .row()
        .text('➕ Добавить категорию', async (ctx) => {
            await ctx.conversation.enter('addProductCategory');
        });
export function getAdminKeyboard() {
    // return Keyboard.keyboard([
    //     ['📊 Статистика', '📦 Заказы'],
    //     ['🛍️ Товары', '➕ Добавить товар'],
    //     ['⬅️ Главное меню']
    // ]).resize();
    return adminMenu;
}

export function getOrdersKeyboard() {
    return InlineKeyboard.from([
        [
            InlineKeyboard.text('📋 Все заказы', 'admin_orders'),
            InlineKeyboard.text('📊 Статистика', 'admin_stats')
        ],
        [
            InlineKeyboard.text('⬅️ Назад', 'admin_back')
        ]
    ]);
}

export function getOrderActionsKeyboard(orderId) {
    return InlineKeyboard.from([
        [
            InlineKeyboard.text('✏️ Изменить статус', `admin_order_status:${orderId}`)
        ],
        [
            InlineKeyboard.text('⬅️ Назад к заказам', 'admin_orders_back')
        ]
    ]);
}

export function getOrderStatusKeyboard(orderId) {
    return InlineKeyboard.from([
        [
            InlineKeyboard.text('✅ Принят', `admin_set_status:${orderId}:accepted`),
            InlineKeyboard.text('🚚 Исполнен', `admin_set_status:${orderId}:completed`)
        ],
        [
            InlineKeyboard.text('❌ Отклонён', `admin_set_status:${orderId}:rejected`),
            InlineKeyboard.text('📝 Создан', `admin_set_status:${orderId}:created`)
        ],
        [
            InlineKeyboard.text('⬅️ Назад', `admin_order_back:${orderId}`)
        ]
    ]);
}