import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RealTimeAnalyticsModule } from './real-time-analytics/real-time-analytics.module';
import { HomeworksModule } from './homeworks/homeworks.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { HomeworksService } from './homeworks/homeworks.service';
import { CacheModule } from '@nestjs/cache-manager'; // Импортируем CacheModule
import { cacheManagerConfig } from './cache.config'; // Создаём конфигурацию кэша (см. ниже)
import { AdminModule } from './admin/admin.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { MailerModule } from './mailer/mailer.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import {
  Homework,
  HomeworkDocument,
} from './homeworks/schemas/homework.schema';
import { Types } from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        maxPoolSize: 10, // Максимум 10 подключений
        serverSelectionTimeoutMS: 5000, // Таймаут выбора сервера
        socketTimeoutMS: 45000, // Таймаут сокета
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60, // Время жизни в секундах
        limit: 10, // Максимум запросов
      },
    ]),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    UsersModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    NotificationsModule,
    AnalyticsModule,
    HomeworksModule,
    AdminModule,
    QuizzesModule,
    TariffsModule,
    MailerModule,
    RealTimeAnalyticsModule,
    CacheModule.register(cacheManagerConfig),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private homeworksService: HomeworksService) {
    console.log('AppModule initialized, imports:', [
      'ConfigModule',
      'MongooseModule',
      'UsersModule',
      'AuthModule',
      'CoursesModule',
      'EnrollmentsModule',
      'NotificationsModule',
      'AnalyticsModule',
      'HomeworksModule',
      'CacheModule.register(cacheManagerConfig)',
      'AdminModule',
      'QuizzesModule',
      'TariffsModule',
      'MailerModule',
    ]);
  }

  onModuleInit() {
    setInterval(
      () => this.homeworksService.checkDeadlines(),
      24 * 60 * 60 * 1000,
    ); // Запуск раз в сутки

    // Периодическая проверка дедлайнов каждые 5 минут
    setInterval(
      async () => {
        console.log('Checking homework deadlines...');
        const homeworks = await this.homeworksService.findAllHomeworks(); // Используем публичный метод
        await Promise.all(
          homeworks.map(
            (
              homework: HomeworkDocument, // Используем HomeworkDocument для явной типизации с _id
            ) =>
              this.homeworksService.checkDeadlineNotifications(
                homework._id.toString(), // Теперь TypeScript распознаёт _id
              ),
          ),
        );
      },
      5 * 60 * 1000,
    ); // 5 минут
  }
}
