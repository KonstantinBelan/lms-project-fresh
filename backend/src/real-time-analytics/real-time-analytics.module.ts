import { Module } from '@nestjs/common';
import { RealTimeAnalyticsGateway } from './real-time-analytics.gateway';
import { RealTimeAnalyticsService } from './real-time-analytics.service';
import { RealTimeAnalyticsController } from './real-time-analytics.controller'; // Новый импорт
import { MongooseModule } from '@nestjs/mongoose';
import {
  Enrollment,
  EnrollmentSchema,
} from '../enrollments/schemas/enrollment.schema';
import { Homework, HomeworkSchema } from '../homeworks/schemas/homework.schema';
import {
  Submission,
  SubmissionSchema,
} from '../homeworks/schemas/submission.schema';
import { CacheModule } from '@nestjs/cache-manager';

// Модуль аналитики в реальном времени
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Homework.name, schema: HomeworkSchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
    CacheModule.register(),
  ],
  controllers: [RealTimeAnalyticsController], // Добавлен контроллер
  providers: [RealTimeAnalyticsGateway, RealTimeAnalyticsService],
  exports: [RealTimeAnalyticsGateway, RealTimeAnalyticsService],
})
export class RealTimeAnalyticsModule {}
