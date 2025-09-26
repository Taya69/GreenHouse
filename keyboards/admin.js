import { Keyboard, InlineKeyboard } from 'grammy';
import { showAdminStats, showAllOrders } from '../handlers/admin.js';
import { Menu } from '@grammyjs/menu';
import { getCategoriesKeyboard } from './categories.js';
import db from '../database.js';

const adminMenu = new Menu('admin-menu')
        .text('📊 Статистика', async (ctx) => {
            await showAdminStats(ctx);
        })
        .row()
        .text('📦 Заказы (все)', async (ctx) => {
            await showAllOrders(ctx);
        })
        .text('🔎 Заказы по статусу', async (ctx) => {
            const kb = InlineKeyboard.from([
                [
                    InlineKeyboard.text('📝 Создан', 'admin_filter_status:created'),
                    InlineKeyboard.text('✅ Принят', 'admin_filter_status:accepted')
                ],
                [
                    InlineKeyboard.text('🚚 Исполнен', 'admin_filter_status:completed'),
                    InlineKeyboard.text('❌ Отклонён', 'admin_filter_status:rejected')
                ]
            ]);
            await ctx.reply('Выберите статус:', { reply_markup: kb });
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
        .text('📂 Категории', async (ctx) => {
            const categories = db.getProductCategories();
            if (!categories || categories.length === 0) {
                await ctx.reply('😔 Нет категорий');
                return;
            }
            for (const c of categories) {
                const kb = InlineKeyboard.from([
                    [
                        InlineKeyboard.text('✏️ Переименовать', `admin_edit_category:${c.id}`),
                        InlineKeyboard.text('🗑️ Удалить', `admin_delete_category:${c.id}`)
                    ]
                ]);
                await ctx.reply(`📂 ${c.name} (ID: ${c.id})`, { reply_markup: kb });
            }
        })
        .text('➕ Добавить категорию', async (ctx) => {
            await ctx.conversation.enter('addProductCategory');
        });
export function getAdminKeyboard() {
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