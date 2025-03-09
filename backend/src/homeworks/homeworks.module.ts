import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeworksService } from './homeworks.service';
import { HomeworksController } from './homeworks.controller';
import { Homework, HomeworkSchema } from './schemas/homework.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { NotificationsModule } from '../notifications/notifications.module'; // Импортируем NotificationsModule
import { CoursesModule } from '../courses/courses.module'; // Импортируем CoursesModule
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '@nestjs/cache-manager'; // Добавляем CacheModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Homework.name, schema: HomeworkSchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
    NotificationsModule,
    forwardRef(() => CoursesModule),
    forwardRef(() => EnrollmentsModule),
    UsersModule,
    CacheModule.register(), // Регистрируем CacheModule
  ],
  providers: [HomeworksService],
  controllers: [HomeworksController],
  exports: [HomeworksService],
})
export class HomeworksModule {
  constructor() {
    console.log('HomeworksModule initialized, imports:', [
      'MongooseModule',
      'NotificationsModule',
      'CoursesModule',
      'EnrollmentsModule',
      'UsersModule',
      'CacheModule',
    ]);
  }
}
