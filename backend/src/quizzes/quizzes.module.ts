import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { QuizSchema } from './schemas/quiz.schema';
import { QuizSubmissionSchema } from './schemas/quiz-submission.schema';
import { EnrollmentsModule } from '../enrollments/enrollments.module'; // Для обновления прогресса студентов
import { NotificationsModule } from '../notifications/notifications.module'; // Для отправки уведомлений
import { CoursesModule } from '../courses/courses.module'; // Для работы с курсами и уроками
import { UsersModule } from '../users/users.module'; // Для получения данных студентов
import { CacheModule } from '@nestjs/cache-manager'; // Для кэширования данных

@Module({
  imports: [
    // Подключение моделей MongoDB
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
  exports: [QuizzesService], // Экспорт сервиса для использования в других модулях
})
export class QuizzesModule {
  constructor() {
    console.log('Инициализация QuizzesModule');
  }
}
