// Функция для экранирования специальных символов Markdown
export function escapeMarkdown(text) {
    if (typeof text !== 'string') return text;
    
    return text
        .replace(/\\([\s\S])|(?<!\\)([*_`\[])/g, '\\$1$2')
        .replace(/\\([\s\S])|(?<!\\)(\[.*?\]\(.*?\))/g, '\\$1$2');
}

// Функция для безопасного создания Markdown текста
export function safeMarkdown(text, options = {}) {
    const {
        bold = false,
        italic = false,
        code = false,
        link = null
    } = options;

    let result = escapeMarkdown(text);

    if (bold) result = `*${result}*`;
    if (italic) result = `_${result}_`;
    if (code) result = `\`${result}\``;
    if (link) result = `[${result}](${escapeMarkdown(link)})`;

    return result;
}

// Функция для проверки валидности Markdown
export function isValidMarkdown(text) {
    if (typeof text !== 'string') return false;
    
    // Проверяем незакрытые теги
    const openBold = (text.match(/\*/g) || []).length;
    const openItalic = (text.match(/_/g) || []).length;
    const openCode = (text.match(/`/g) || []).length;
    
    if (openBold % 2 !== 0) return false;
    if (openItalic % 2 !== 0) return false;
    if (openCode % 2 !== 0) return false;
    
    // Проверяем ссылки
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
        const [, linkText, linkUrl] = match;
        if (!linkText || !linkUrl) return false;
    }
    
    return true;
}

// Функция для безопасной отправки сообщений с Markdown
export async function sendSafeMessage(ctx, text, options = {}) {
    const finalOptions = { ...options };
    
    // Если используется Markdown, проверяем валидность
    if (finalOptions.parse_mode === 'Markdown' || finalOptions.parse_mode === 'MarkdownV2') {
        if (!isValidMarkdown(text)) {
            console.warn('Обнаружен невалидный Markdown, отключаем разметку:', text);
            // Экранируем текст и отключаем разметку
            finalOptions.parse_mode = undefined;
            text = escapeMarkdown(text);
        }
    }
    
    return await ctx.reply(text, finalOptions);
}