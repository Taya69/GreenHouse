import { InlineKeyboard } from "grammy";
import config from "../config.js";
import db from "../database.js";

export function getCategoriesKeyboard() {
  const keyboard = new InlineKeyboard();
  
  const categories = db.getProductCategories();
  // Кнопка для показа всех товаров во всех категориях
  keyboard.text('Все товары', 'category_0');
  keyboard.row();
  categories.forEach((category, index) => {
    if (index % 2 === 0 && index > 0) {
      keyboard.row();
    }
    keyboard.text(category.name, `category_${category.id}`);
  });
  
  return keyboard;
}

export function getCategoriesInlineKeyboard() {
    const keyboard = [];
    const categories = db.getProductCategories();
    // Разбиваем категории на ряды по 3 для inline клавиатуры
    for (let i = 0; i < categories.length; i += 3) {
        const row = [];
        for (let j = 0; j < 3; j++) {
            if (categories[i + j]) {
                row.push(InlineKeyboard.text(
                    categories[i + j].name, 
                    `select_category:${categories[i + j].id}`
                ));
            }
        }
        keyboard.push(row);
    }
    
    keyboard.push([
        InlineKeyboard.text('➕ Новая категория', 'new_category'),
        InlineKeyboard.text('❌ Отмена', 'cancel_add_product')
    ]);
    
    return InlineKeyboard.from(keyboard);
}