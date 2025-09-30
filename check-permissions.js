// check-permissions.js
import fs from 'fs';

try {
  // Проверяем права на запись в текущую директорию
  fs.accessSync('.', fs.constants.W_OK);
  console.log('✅ Права на запись в текущую директорию: OK');
  
  // Проверяем права на базу данных
  if (fs.existsSync('./shop.db')) {
    fs.accessSync('./shop.db', fs.constants.W_OK);
    console.log('✅ Права на базу данных: OK');
  } else {
    console.log('ℹ️ База данных не существует, будет создана при первом запуске');
  }
  
  console.log('✅ Проверка прав доступа завершена успешно');
} catch (error) {
  console.error('❌ Ошибка прав доступа:', error.message);
  process.exit(1);
}