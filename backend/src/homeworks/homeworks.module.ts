import { Module, forwardRef, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeworksService } from './homeworks.service';
import { HomeworksController } from './homeworks.controller';
import { Homework, HomeworkSchema } from './schemas/homework.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '@nestjs/cache-manager';

/**
 * Модуль для управления домашними заданиями и их решениями
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Homework.name, schema: HomeworkSchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
    forwardRef(() => NotificationsModule), // Модуль уведомлений
    forwardRef(() => CoursesModule), // Модуль курсов
    forwardRef(() => EnrollmentsModule), // Модуль записей на курсы
    UsersModule, // Модуль пользователей
    CacheModule.register(), // Модуль кэширования
  ],
  providers: [HomeworksService],
  controllers: [HomeworksController],
  exports: [HomeworksService],
})
export class HomeworksModule {
  private readonly logger = new Logger(HomeworksModule.name);

  constructor() {
    this.logger.log(
      'Модуль HomeworksModule инициализирован с зависимостями: MongooseModule, NotificationsModule, CoursesModule, EnrollmentsModule, UsersModule, CacheModule',
    );
  }
}
