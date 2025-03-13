// src/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { MailerService } from './mailer.service';
import { MailerController } from './mailer.controller';
import { MailerProcessor } from './mailer.processor';
import { join } from 'path';

@Module({
  imports: [
    NestMailerModule.forRoot({
      transport: {
        host:
          process.env.EMAIL_HOST ??
          (() => {
            throw new Error('Переменная окружения EMAIL_HOST не задана');
          })(),
        port: (() => {
          const port = process.env.EMAIL_PORT
            ? parseInt(process.env.EMAIL_PORT, 10)
            : 587;
          if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error('Некорректное значение EMAIL_PORT');
          }
          return port;
        })(),
        secure: false, // true для 465, false для 587
        auth: {
          user:
            process.env.EMAIL_USER ??
            (() => {
              throw new Error('Переменная окружения EMAIL_USER не задана');
            })(),
          pass:
            process.env.EMAIL_PASS ??
            (() => {
              throw new Error('Переменная окружения EMAIL_PASS не задана');
            })(),
        },
      },
      defaults: {
        from: '"Deasy LMS" <kosbelan@gmail.com>',
      },
      template: {
        // dir: join(process.cwd(), 'dist', 'mailer', 'templates'), // Папка с шаблонами писем
        dir: join(__dirname, '..', 'templates'), // Путь к шаблонам относительно текущего файла
        adapter: new HandlebarsAdapter(), // Используем Handlebars для рендеринга шаблонов
        options: { strict: true },
      },
    }),
    BullModule.registerQueue({
      name: 'mailer', // Очередь для обработки писем
    }),
  ],
  controllers: [MailerController],
  providers: [MailerService, MailerProcessor],
  exports: [MailerService],
})
export class MailerModule {
  // Проверка наличия обязательных переменных окружения при запуске модуля
  constructor() {
    const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS'];
    requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        throw new Error(
          `Переменная окружения ${envVar} обязательна для работы модуля Mailer`,
        );
      }
    });
  }
}
