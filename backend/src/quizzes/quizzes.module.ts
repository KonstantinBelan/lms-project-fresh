import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { QuizSchema } from './schemas/quiz.schema';
import { QuizSubmissionSchema } from './schemas/quiz-submission.schema';
import { EnrollmentsModule } from '../enrollments/enrollments.module'; // Для интеграции

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Quiz', schema: QuizSchema },
      { name: 'QuizSubmission', schema: QuizSubmissionSchema },
    ]),
    EnrollmentsModule, // Для обновления прогресса
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
