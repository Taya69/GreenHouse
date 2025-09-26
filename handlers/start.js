import db from '../database.js';
import { getAdminKeyboard } from '../keyboards/admin.js';
import { getMainKeyboard } from '../keyboards/main.js';
import { isAdmin } from '../utils/helpers.js';
import config from '../config.js';

export async function handleStart(ctx) {
    // const user = db.getUser(ctx.from.id);
    
    // if (!user) {
    //     await db.createUser(ctx.from);
    //     await sendWelcomeMessage(ctx, true);
    // } else {
    //     await sendWelcomeMessage(ctx, false);
    // }
     const user = await db.getUser(ctx.from.id);

    if (!user) {
        await db.createUser(ctx.from);
    }
    if (isAdmin(ctx.from.id)) {
        await ctx.reply('Главное меню:', {
        reply_markup: getAdminKeyboard()
    });
    } else {
        await ctx.reply(`🌿 *Добро пожаловать в GreenHouse!* 🌿\n\nЗдесь вы найдете свежие овощи, фрукты и зелень прямо с грядки!`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🚀 Начать покупки', callback_data: 'start_shopping' }]] }
    });
    }
}

// export async function handleStartButton(ctx) {
//     await ctx.reply('Отлично! Давайте начнем покупки! 🛍️', {
//         reply_markup: { remove_keyboard: true }
//     });
    
//     await ctx.reply('Главное меню:', {
//         reply_markup: getMainKeyboard()
//     });
// }

export async function handleMainMenu(ctx) {
    await ctx.reply('Главное меню:', {
        reply_markup: getMainKeyboard()
    });
}