import * as dotenv from 'dotenv'; // Импортируем dotenv для явной загрузки (опционально)

// Явно загружаем .env (если не загружен через main.ts)
dotenv.config();

export const config = {
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-specific-password',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || 'your-telegram-bot-token',
    // chatId: process.env.TELEGRAM_CHAT_ID || 'your-chat-id',
  },
};

// Добавляем отладку
console.log('Config loaded - Email:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? '***' : 'undefined',
});
console.log('Config loaded - Telegram:', {
  botToken: process.env.TELEGRAM_BOT_TOKEN ? '***' : 'undefined',
  // chatId: process.env.TELEGRAM_CHAT_ID,
});
