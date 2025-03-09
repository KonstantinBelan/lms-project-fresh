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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    forwardRef(() => EnrollmentsModule),
    UsersModule,
    forwardRef(() => CoursesModule), // Добавляем forwardRef для CoursesModule
    forwardRef(() => HomeworksModule),
    ConfigModule,
    BullModule.registerQueue({ name: 'notifications' }),
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
    console.log('NotificationsModule initialized, imports:', [
      'MongooseModule',
      'EnrollmentsModule',
      'UsersModule',
      'CoursesModule',
      'ConfigModule',
    ]);
  }
}
