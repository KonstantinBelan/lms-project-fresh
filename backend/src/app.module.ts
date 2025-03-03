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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
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
    ]);
  }
}
export class AppModule implements OnModuleInit {
  constructor(private homeworksService: HomeworksService) {}

  onModuleInit() {
    setInterval(
      () => this.homeworksService.checkDeadlines(),
      24 * 60 * 60 * 1000,
    ); // Запуск раз в сутки
  }
}
