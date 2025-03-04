import { Module } from '@nestjs/common';
import { RealTimeAnalyticsGateway } from './real-time-analytics.gateway';
import { RealTimeAnalyticsService } from './real-time-analytics.service';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Homework.name, schema: HomeworkSchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
  ],
  providers: [RealTimeAnalyticsGateway, RealTimeAnalyticsService],
  exports: [RealTimeAnalyticsGateway, RealTimeAnalyticsService],
})
export class RealTimeAnalyticsModule {}
