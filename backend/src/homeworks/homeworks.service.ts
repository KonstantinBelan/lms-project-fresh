import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Homework, HomeworkDocument } from './schemas/homework.schema';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesService } from '../courses/courses.service';
import { Types } from 'mongoose';

@Injectable()
export class HomeworksService {
  constructor(
    @InjectModel(Homework.name) private homeworkModel: Model<HomeworkDocument>,
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
    private notificationsService: NotificationsService,
    private coursesService: CoursesService,
  ) {}

  async createHomework(
    createHomeworkDto: CreateHomeworkDto,
  ): Promise<Homework> {
    const newHomework = new this.homeworkModel({
      ...createHomeworkDto,
      lessonId: new Types.ObjectId(createHomeworkDto.lessonId), // Явно преобразовываем lessonId в ObjectId
    });
    return newHomework.save();
  }

  async updateHomework(
    id: string,
    updateHomeworkDto: UpdateHomeworkDto,
  ): Promise<Homework | null> {
    return this.homeworkModel
      .findByIdAndUpdate(id, updateHomeworkDto, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  async deleteHomework(id: string): Promise<void> {
    await this.homeworkModel.findByIdAndDelete(id).exec();
  }

  async findHomeworkById(id: string): Promise<Homework | null> {
    return this.homeworkModel.findById(id).exec();
  }

  async findHomeworksByLesson(lessonId: string): Promise<Homework[]> {
    const objectId = new Types.ObjectId(lessonId); // Явно создаём ObjectId
    console.log('Searching homeworks for lessonId:', { lessonId, objectId });
    return this.homeworkModel.find({ lessonId: objectId }).exec();
  }

  async createSubmission(
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<Submission> {
    const newSubmission = new this.submissionModel({
      ...createSubmissionDto,
      homeworkId: new Types.ObjectId(createSubmissionDto.homeworkId), // Явно преобразовываем homeworkId в ObjectId
      studentId: new Types.ObjectId(createSubmissionDto.studentId), // Явно преобразовываем studentId в ObjectId
    });
    return newSubmission.save();
  }

  async updateSubmission(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission | null> {
    return this.submissionModel
      .findByIdAndUpdate(id, updateSubmissionDto, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  async findSubmissionById(id: string): Promise<Submission | null> {
    return this.submissionModel.findById(id).exec();
  }

  async findSubmissionsByHomework(homeworkId: string): Promise<Submission[]> {
    const objectId = new Types.ObjectId(homeworkId); // Явно создаём ObjectId
    console.log('Searching submissions for homeworkId:', {
      homeworkId,
      objectId,
    });
    return this.submissionModel.find({ homeworkId: objectId }).exec();
  }

  async findSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    const objectId = new Types.ObjectId(studentId); // Явно создаём ObjectId
    return this.submissionModel.find({ studentId: objectId }).exec();
  }

  async checkDeadlines(): Promise<void> {
    const homeworks = await this.homeworkModel
      .find({ deadline: { $exists: true }, isActive: true })
      .exec();
    const now = new Date();

    for (const homework of homeworks as HomeworkDocument[]) {
      if (!homework.deadline) continue;

      const daysLeft = Math.ceil(
        (homework.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const lesson = await this.findHomeworkById(homework.lessonId.toString());
      if (!lesson) continue;

      const course = await this.coursesService.findCourseByLesson(
        lesson.lessonId.toString(),
      );

      if (daysLeft <= 7 && daysLeft > 0) {
        await this.notificationsService.notifyDeadline(
          (homework._id as Types.ObjectId).toString(),
          daysLeft,
          `Homework for ${course?.title || 'Unknown Course'}: ${homework.description}`,
        );
      }
    }
  }
}
