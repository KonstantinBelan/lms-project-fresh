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
        host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Для Gmail
        port: process.env.EMAIL_PORT
          ? parseInt(process.env.EMAIL_PORT, 10)
          : 587,
        secure: false, // true для 465, false для 587
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com', // Твой email
          pass: process.env.EMAIL_PASS || 'your-app-specific-password', // Пароль приложения (не обычный пароль!)
        },
      },
      defaults: {
        from: '"Deasy LMS" <kosbelan@gmail.com>',
      },
      template: {
        dir: join(process.cwd(), 'dist', 'mailer', 'templates'), // Папка с шаблонами
        adapter: new HandlebarsAdapter(), // Используем Handlebars для шаблонов
        options: { strict: true },
      },
    }),
    BullModule.registerQueue({
      name: 'mailer', // Отдельная очередь для писем
    }),
  ],
  controllers: [MailerController],
  providers: [MailerService, MailerProcessor],
  exports: [MailerService],
})
export class MailerModule {}
