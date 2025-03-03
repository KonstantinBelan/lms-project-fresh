import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeworksService } from './homeworks.service';
import { HomeworksController } from './homeworks.controller';
import { Homework, HomeworkSchema } from './schemas/homework.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Homework.name, schema: HomeworkSchema },
      { name: Submission.name, schema: SubmissionSchema },
    ]),
  ],
  providers: [HomeworksService],
  controllers: [HomeworksController],
})
export class HomeworksModule {}
