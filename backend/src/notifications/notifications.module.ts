// src/notifications/notifications.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { HomeworksModule } from '../homeworks/homeworks.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
// import { MailerModule } from '../mailer/mailer.module'; // Добавляем MailerModule

@Module({
  imports: [
    // Подключение модели Notification для MongoDB
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    forwardRef(() => EnrollmentsModule),
    UsersModule,
    forwardRef(() => CoursesModule),
    forwardRef(() => HomeworksModule),
    ConfigModule,
    // Настройка очереди для обработки уведомлений
    BullModule.registerQueue({
      name: 'notifications',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    CacheModule.register(),
    // MailerModule, // Добавляем поддержку email
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ConfigService,
    NotificationsProcessor,
    NotificationsGateway,
  ],
  exports: [NotificationsService, MongooseModule, NotificationsGateway],
})
export class NotificationsModule {
  constructor() {
    console.log('Инициализация NotificationsModule, импорты:', [
      'MongooseModule',
      'EnrollmentsModule',
      'UsersModule',
      'CoursesModule',
      'ConfigModule',
      'MailerModule',
    ]);
  }
}
