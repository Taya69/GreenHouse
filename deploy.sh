#!/bin/bash

echo "🚀 Starting deployment..."

# Останавливаем предыдущую версию (если есть)
pm2 stop telegram-bot || true

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Run tests (если есть)
# npm test

# Start with PM2
pm2 start index.js --name "telegram-bot"

echo "✅ Deployment completed!"