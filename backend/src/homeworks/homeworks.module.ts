import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeworksService } from './homeworks.service';
import { HomeworksController } from './homeworks.controller';
import { Homework, HomeworkSchema } from './schemas/homework.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { NotificationsModule } from '../notifications/notifications.module'; // Импортируем NotificationsModule
import { CoursesModule } from '../courses/courses.module'; // Импортируем CoursesModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Homework.name, schema: HomeworkSchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
    // forwardRef(() => NotificationsModule), // Используем forwardRef для NotificationsModule
    // forwardRef(() => CoursesModule), // Используем forwardRef для CoursesModule
    NotificationsModule,
    CoursesModule,
  ],
  providers: [HomeworksService],
  controllers: [HomeworksController],
  exports: [HomeworksService],
})
export class HomeworksModule {}
