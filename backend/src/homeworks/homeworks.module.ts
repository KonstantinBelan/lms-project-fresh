import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeworksService } from './homeworks.service';
import { HomeworksController } from './homeworks.controller';
import { Homework, HomeworkSchema } from './schemas/homework.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { NotificationsModule } from '../notifications/notifications.module'; // Импортируем NotificationsModule
import { CoursesModule } from '../courses/courses.module'; // Импортируем CoursesModule
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Homework.name, schema: HomeworkSchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
    NotificationsModule,
    CoursesModule,
    EnrollmentsModule,
  ],
  providers: [HomeworksService],
  controllers: [HomeworksController],
  exports: [HomeworksService],
})
export class HomeworksModule {}
