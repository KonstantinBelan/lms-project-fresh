import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from './schemas/enrollment.schema';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { HomeworksModule } from '../homeworks/homeworks.module';
import { QuizzesModule } from '../quizzes/quizzes.module';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    CacheModule.register(), // Регистрируем CacheModule
    UsersModule,
    forwardRef(() => CoursesModule),
    AuthModule,
    forwardRef(() => NotificationsModule),
    BullModule.forRoot({
      redis: { host: 'localhost', port: 6379 }, // Укажи свои настройки Redis
    }),
    BullModule.registerQueue({ name: 'notifications' }),
    forwardRef(() => HomeworksModule), // Используем forwardRef для HomeworksModule
    forwardRef(() => QuizzesModule), // Используем forwardRef для QuizzesModule
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService, MongooseModule],
})
export class EnrollmentsModule {
  constructor() {
    console.log('EnrollmentsModule initialized, imports:', [
      'MongooseModule',
      'CacheModule',
      'UsersModule',
      'CoursesModule',
      'AuthModule',
      'NotificationsModule',
    ]);
  }
}
