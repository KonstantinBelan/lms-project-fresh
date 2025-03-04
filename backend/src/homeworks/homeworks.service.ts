import { Inject, Injectable } from '@nestjs/common';
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
import { CACHE_MANAGER } from '@nestjs/cache-manager'; // Импортируем CACHE_MANAGER
import { Cache } from 'cache-manager'; // Импортируем Cache

@Injectable()
export class HomeworksService {
  constructor(
    @InjectModel(Homework.name) private homeworkModel: Model<HomeworkDocument>,
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
    private notificationsService: NotificationsService,
    private coursesService: CoursesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Инжектируем кэш
  ) {}

  async createHomework(
    createHomeworkDto: CreateHomeworkDto,
  ): Promise<HomeworkDocument> {
    const newHomework = new this.homeworkModel({
      ...createHomeworkDto,
      lessonId: new Types.ObjectId(createHomeworkDto.lessonId),
    });
    const savedHomework: HomeworkDocument = await newHomework.save();

    // Очищаем кэш для связанных данных
    await this.cacheManager.del(
      `homework:${(savedHomework._id as Types.ObjectId).toString()}`,
    );
    await this.cacheManager.del(
      `homeworks:lesson:${createHomeworkDto.lessonId}`,
    );

    return savedHomework;
  }

  async updateHomework(
    id: string,
    updateHomeworkDto: UpdateHomeworkDto,
  ): Promise<Homework | null> {
    await this.cacheManager.del(`homework:${id}`); // Очищаем кэш для этой записи
    await this.cacheManager.del('homeworks:lesson:*'); // Очищаем кэш всех уроков

    return this.homeworkModel
      .findByIdAndUpdate(id, updateHomeworkDto, {
        new: true,
        runValidators: true,
      })
      .lean()
      .exec();
  }

  async deleteHomework(id: string): Promise<void> {
    await this.cacheManager.del(`homework:${id}`); // Очищаем кэш для этой записи
    await this.cacheManager.del('homeworks:lesson:*'); // Очищаем кэш всех уроков
    await this.homeworkModel.findByIdAndDelete(id).exec();
  }

  async findHomeworkById(id: string): Promise<Homework | null> {
    const cacheKey = `homework:${id}`;
    const cachedHomework = await this.cacheManager.get<Homework>(cacheKey);
    if (cachedHomework) {
      console.log('Homework found in cache:', cachedHomework);
      return cachedHomework;
    }

    const homework = await this.homeworkModel.findById(id).lean().exec();
    console.log('Homework found in DB:', homework);
    if (homework) await this.cacheManager.set(cacheKey, homework, 3600); // Кэшируем на 1 час
    return homework;
  }

  async findHomeworksByLesson(lessonId: string): Promise<Homework[]> {
    const cacheKey = `homeworks:lesson:${lessonId}`;
    const cachedHomeworks = await this.cacheManager.get<Homework[]>(cacheKey);
    if (cachedHomeworks) {
      console.log('Homeworks found in cache for lesson:', cachedHomeworks);
      return cachedHomeworks;
    }

    const objectId = new Types.ObjectId(lessonId);
    console.log('Searching homeworks for lessonId:', { lessonId, objectId });
    const homeworks = await this.homeworkModel
      .find({ lessonId: objectId })
      .lean()
      .exec();
    console.log('Homeworks found in DB for lesson:', homeworks);
    if (homeworks.length > 0)
      await this.cacheManager.set(cacheKey, homeworks, 3600); // Кэшируем на 1 час
    return homeworks;
  }

  async createSubmission(
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<SubmissionDocument> {
    const newSubmission = new this.submissionModel({
      ...createSubmissionDto,
      homeworkId: new Types.ObjectId(createSubmissionDto.homeworkId),
      studentId: new Types.ObjectId(createSubmissionDto.studentId),
    });
    const savedSubmission: SubmissionDocument = await newSubmission.save();

    // Очищаем кэш для связанных данных
    await this.cacheManager.del(
      `submission:${(savedSubmission._id as Types.ObjectId).toString()}`,
    );
    await this.cacheManager.del(
      `submissions:homework:${createSubmissionDto.homeworkId}`,
    );
    await this.cacheManager.del(
      `submissions:student:${createSubmissionDto.studentId}`,
    );

    return savedSubmission;
  }

  async updateSubmission(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission | null> {
    await this.cacheManager.del(`submission:${id}`); // Очищаем кэш для этой записи
    await this.cacheManager.del('submissions:homework:*'); // Очищаем кэш всех домашних заданий
    await this.cacheManager.del('submissions:student:*'); // Очищаем кэш всех студентов

    return this.submissionModel
      .findByIdAndUpdate(id, updateSubmissionDto, {
        new: true,
        runValidators: true,
      })
      .lean()
      .exec();
  }

  async findSubmissionById(id: string): Promise<Submission | null> {
    const cacheKey = `submission:${id}`;
    const cachedSubmission = await this.cacheManager.get<Submission>(cacheKey);
    if (cachedSubmission) {
      console.log('Submission found in cache:', cachedSubmission);
      return cachedSubmission;
    }

    const submission = await this.submissionModel.findById(id).lean().exec();
    console.log('Submission found in DB:', submission);
    if (submission) await this.cacheManager.set(cacheKey, submission, 3600); // Кэшируем на 1 час
    return submission;
  }

  async findSubmissionsByHomework(homeworkId: string): Promise<Submission[]> {
    const cacheKey = `submissions:homework:${homeworkId}`;
    const cachedSubmissions =
      await this.cacheManager.get<Submission[]>(cacheKey);
    if (cachedSubmissions) {
      console.log(
        'Submissions found in cache for homework:',
        cachedSubmissions,
      );
      return cachedSubmissions;
    }

    const objectId = new Types.ObjectId(homeworkId);
    console.log('Searching submissions for homeworkId:', {
      homeworkId,
      objectId,
    });
    const submissions = await this.submissionModel
      .find({ homeworkId: objectId })
      .lean()
      .exec();
    console.log('Submissions found in DB for homework:', submissions);
    if (submissions.length > 0)
      await this.cacheManager.set(cacheKey, submissions, 3600); // Кэшируем на 1 час
    return submissions;
  }

  async findSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    const cacheKey = `submissions:student:${studentId}`;
    const cachedSubmissions =
      await this.cacheManager.get<Submission[]>(cacheKey);
    if (cachedSubmissions) {
      console.log('Submissions found in cache for student:', cachedSubmissions);
      return cachedSubmissions;
    }

    const objectId = new Types.ObjectId(studentId);
    const submissions = await this.submissionModel
      .find({ studentId: objectId })
      .lean()
      .exec();
    console.log('Submissions found in DB for student:', submissions);
    if (submissions.length > 0)
      await this.cacheManager.set(cacheKey, submissions, 3600); // Кэшируем на 1 час
    return submissions;
  }

  async checkDeadlines(): Promise<void> {
    const cacheKey = 'homeworks:deadlines';
    const cachedDeadlines = await this.cacheManager.get<any>(cacheKey);
    if (cachedDeadlines) {
      console.log('Deadlines found in cache:', cachedDeadlines);
      for (const [homeworkId, daysLeft] of Object.entries(cachedDeadlines)) {
        if ((daysLeft as number) <= 7 && (daysLeft as number) > 0) {
          const homework = await this.findHomeworkById(homeworkId);
          if (homework) {
            const lesson = await this.findHomeworkById(
              homework.lessonId.toString(),
            );
            if (lesson) {
              const course = await this.coursesService.findCourseByLesson(
                lesson.lessonId.toString(),
              );
              await this.notificationsService.notifyDeadline(
                homeworkId,
                daysLeft as number,
                `Homework for ${course?.title || 'Unknown Course'}: ${homework.description}`,
              );
            }
          }
        }
      }
      return;
    }

    const homeworks = await this.homeworkModel
      .find({ deadline: { $exists: true }, isActive: true })
      .exec();
    const now = new Date();
    const deadlineCache: { [key: string]: number } = {};

    for (const homework of homeworks as HomeworkDocument[]) {
      if (!homework.deadline) continue;

      const daysLeft: number = Math.ceil(
        (homework.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      deadlineCache[(homework._id as Types.ObjectId).toString()] = daysLeft;

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

    await this.cacheManager.set(cacheKey, deadlineCache, 3600); // Кэшируем дедлайны на 1 час
  }

  // Новая функция для автоматической проверки решений
  async autoCheckSubmission(
    submissionId: string,
  ): Promise<{ grade: number; comment: string }> {
    const cacheKey = `submission:check:${submissionId}`;
    const cachedResult = await this.cacheManager.get<{
      grade: number;
      comment: string;
    }>(cacheKey);
    if (cachedResult) {
      console.log('Auto-check result found in cache:', cachedResult);
      return cachedResult;
    }

    const submission = await this.submissionModel
      .findById(submissionId)
      .lean()
      .exec();
    if (!submission) throw new Error('Submission not found');

    // Логика автоматической проверки (пример: простой подсчёт правильных ответов)
    const correctAnswers = 10; // Пример: предполагаем, что задание имеет 10 вопросов
    const submittedAnswers = submission.submissionContent
      .split(',')
      .filter(Boolean).length; // Парсим ответы, игнорируя пустые
    const grade = Math.min(100, (submittedAnswers / correctAnswers) * 100);
    const comment = `Auto-checked: ${grade}% based on ${submittedAnswers} correct answers out of ${correctAnswers}.`;

    // Обновляем submission в базе
    await this.submissionModel
      .findByIdAndUpdate(submissionId, {
        grade,
        teacherComment: comment,
        isReviewed: true,
      })
      .exec();

    // Уведомить студента о проверке
    await this.notificationsService.sendNotification({
      userId: submission.studentId.toString(),
      message: `Your submission for homework ${submission.homeworkId} has been auto-checked with grade ${grade}%.`,
      type: 'homework',
    });

    // Очищаем кэш для связанных данных
    await this.cacheManager.del(`submission:${submissionId}`);
    await this.cacheManager.del(
      `submissions:homework:${submission.homeworkId}`,
    );
    await this.cacheManager.del(`submissions:student:${submission.studentId}`);

    const result = { grade, comment };
    await this.cacheManager.set(cacheKey, result, 3600); // Кэшируем результат на 1 час
    return result;
  }

  // Новая функция для проверки просроченных дедлайнов
  async checkDeadlineNotifications(homeworkId: string): Promise<void> {
    const cacheKey = `deadline:notifications:${homeworkId}`;
    const cachedNotifications = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotifications) {
      console.log(
        'Deadline notifications found in cache:',
        cachedNotifications,
      );
      return;
    }

    const homework = await this.homeworkModel
      .findById(homeworkId)
      .lean()
      .exec();
    if (!homework) throw new Error('Homework not found');

    const now = new Date();
    const deadline = new Date(homework.deadline);
    if (now > deadline) {
      const submissions = await this.submissionModel
        .find({ homeworkId: homework._id })
        .lean()
        .exec();
      const lateSubmissions = submissions.filter(
        (s) => !s.isReviewed && new Date(s.createdAt) > deadline,
      );

      if (lateSubmissions.length > 0) {
        // Уведомить администратора и студентов о просроченных дедлайнах
        await Promise.all(
          lateSubmissions.map(async (submission) => {
            await this.notificationsService.sendNotification({
              userId: submission.studentId.toString(),
              message: `Your submission for homework ${homeworkId} is late. Please review and resubmit if possible.`,
              type: 'deadline',
            });

            await this.notificationsService.sendNotification({
              userId: 'admin', // Замени на реальный ID администратора
              message: `Late submission detected for homework ${homeworkId} by student ${submission.studentId}.`,
              type: 'admin',
            });
          }),
        );
      }

      await this.cacheManager.set(cacheKey, { checked: true }, 3600); // Кэшируем проверку на 1 час
    }
  }
}
