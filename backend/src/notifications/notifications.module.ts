import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    forwardRef(() => EnrollmentsModule),
    UsersModule,
    forwardRef(() => CoursesModule), // Добавляем forwardRef для CoursesModule
    ConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, ConfigService],
  exports: [NotificationsService, MongooseModule],
})
export class NotificationsModule {
  constructor() {
    console.log('NotificationsModule initialized, imports:', [
      'MongooseModule',
      'EnrollmentsModule',
      'UsersModule',
      'CoursesModule',
      'ConfigModule',
    ]);
  }
}
