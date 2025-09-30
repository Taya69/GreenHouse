FROM node:18-alpine

# Устанавливаем зависимости для better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости (только продакшен)
RUN npm install --production

# Копируем исходный код
COPY . .

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001

# Меняем владельца файлов
RUN chown -R botuser:nodejs /app
USER botuser

# Открываем порт (если нужен для health checks)
EXPOSE 3000

# Запускаем приложение
CMD ["node", "index.js"]