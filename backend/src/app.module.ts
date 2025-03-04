import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HomeworksModule } from './homeworks/homeworks.module';
import { HomeworksService } from './homeworks/homeworks.service';
import { CacheModule } from '@nestjs/cache-manager'; // Импортируем CacheModule
import { cacheManagerConfig } from './cache.config'; // Создаём конфигурацию кэша (см. ниже)
import { RealTimeAnalyticsModule } from './real-time-analytics/real-time-analytics.module'; // Убедимся, что путь корректен
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    NotificationsModule,
    AnalyticsModule,
    HomeworksModule,
    CacheModule.register(cacheManagerConfig),
    RealTimeAnalyticsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
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
      'RealTimeAnalyticsModule',
      'AdminModule',
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
        const homeworks = await this.homeworksService.findAllHomeworks(); // Используем публичный метод вместо прямого доступа к homeworkModel
        await Promise.all(
          homeworks.map((homework) =>
            this.homeworksService.checkDeadlineNotifications(
              homework._id.toString(),
            ),
          ),
        );
      },
      5 * 60 * 1000,
    ); // 5 минут
  }
}
