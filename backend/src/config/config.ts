import * as dotenv from 'dotenv'; // Импортируем dotenv для работы с переменными окружения

// Загружаем переменные из файла .env
dotenv.config();

// Интерфейс для описания структуры конфигурации
interface AppConfig {
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  telegram: {
    botToken: string;
  };
}

// Конфигурация приложения с переменными окружения
export const config: AppConfig = {
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-specific-password',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || 'your-telegram-bot-token',
  },
};

// Выводим отладочную информацию в консоль
console.log('Конфигурация загружена - Email:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? '***' : 'не определено',
});
console.log('Конфигурация загружена - Telegram:', {
  botToken: process.env.TELEGRAM_BOT_TOKEN ? '***' : 'не определено',
});

// Проверка на наличие обязательных переменных окружения
if (
  !process.env.EMAIL_USER ||
  !process.env.EMAIL_PASS ||
  !process.env.TELEGRAM_BOT_TOKEN
) {
  throw new Error(
    'Отсутствуют обязательные переменные окружения: EMAIL_USER, EMAIL_PASS или TELEGRAM_BOT_TOKEN',
  );
}
