import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { QuizSchema } from './schemas/quiz.schema';
import { QuizSubmissionSchema } from './schemas/quiz-submission.schema';
import { EnrollmentsModule } from '../enrollments/enrollments.module'; // Для интеграции
import { NotificationsModule } from '../notifications/notifications.module';
import { CoursesModule } from '../courses/courses.module';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Quiz', schema: QuizSchema },
      { name: 'QuizSubmission', schema: QuizSubmissionSchema },
    ]),
    forwardRef(() => EnrollmentsModule),
    forwardRef(() => CoursesModule),
    NotificationsModule, // Добавляем для NotificationsService
    UsersModule,
    CacheModule.register(),
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
