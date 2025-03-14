import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { QuizSchema } from './schemas/quiz.schema';
import { QuizSubmissionSchema } from './schemas/quiz-submission.schema';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CoursesModule } from '../courses/courses.module';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '@nestjs/cache-manager';

// Модуль для работы с викторинами
@Module({
  imports: [
    // Подключение схем MongoDB
    MongooseModule.forFeature([
      { name: 'Quiz', schema: QuizSchema },
      { name: 'QuizSubmission', schema: QuizSubmissionSchema },
    ]),
    // Модули с forwardRef для избежания циклических зависимостей
    forwardRef(() => EnrollmentsModule),
    forwardRef(() => CoursesModule),
    NotificationsModule,
    UsersModule,
    CacheModule.register(),
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService], // Экспорт сервиса для других модулей
})
export class QuizzesModule {
  constructor() {
    console.log('Инициализация модуля викторин');
  }
}
