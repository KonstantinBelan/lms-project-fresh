import {
  Inject,
  Injectable,
  forwardRef,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EnrollmentsService } from '../enrollments/enrollments.service';

@Injectable()
export class HomeworksService {
  private readonly logger = new Logger(HomeworksService.name);

  constructor(
    @InjectModel(Homework.name) private homeworkModel: Model<HomeworkDocument>,
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService,
    private enrollmentsService: EnrollmentsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.debug('Конструктор HomeworksService вызван');
    this.logger.debug('Модель домашних заданий:', !!this.homeworkModel);
    this.logger.debug('Модель подписок ДЗ:', !!this.submissionModel);
    this.logger.debug('Сервис уведомлений:', !!this.notificationsService);
    this.logger.debug('Сервис курсов:', !!this.coursesService);
    this.logger.debug('Сервис поступлений:', !!this.enrollmentsService);
  }

  // Методы для домашних заданий (уже обработаны в предыдущем шаге)
  async findAllHomeworks(): Promise<HomeworkDocument[]> {
    return this.homeworkModel
      .find({ deadline: { $exists: true }, isActive: true })
      .lean()
      .exec();
  }

  async createHomework(
    createHomeworkDto: CreateHomeworkDto,
  ): Promise<HomeworkDocument> {
    const deadline = createHomeworkDto.deadline
      ? new Date(createHomeworkDto.deadline)
      : undefined;
    if (createHomeworkDto.deadline && isNaN(deadline!.getTime())) {
      throw new BadRequestException('Некорректный формат даты дедлайна');
    }

    const newHomework = new this.homeworkModel({
      ...createHomeworkDto,
      lessonId: new Types.ObjectId(createHomeworkDto.lessonId),
      points: createHomeworkDto.points || 10,
      deadline,
    });
    const savedHomework: HomeworkDocument = await newHomework.save();

    await this.cacheManager.del(`homework:${savedHomework._id.toString()}`);
    await this.cacheManager.del(
      `homeworks:lesson:${createHomeworkDto.lessonId}`,
    );

    this.logger.log(`Создано домашнее задание с ID: ${savedHomework._id}`);
    return savedHomework;
  }

  // Обновление домашнего задания
  async updateHomework(
    id: string,
    updateHomeworkDto: UpdateHomeworkDto,
  ): Promise<HomeworkDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }

    // Создаём объект с явной типизацией для всех полей
    const updateData: Partial<Homework> & {
      deadline?: Date;
      lessonId?: Types.ObjectId;
    } = {};

    // Преобразуем и добавляем свойства, если они присутствуют в updateHomeworkDto
    if (updateHomeworkDto.lessonId) {
      if (!Types.ObjectId.isValid(updateHomeworkDto.lessonId)) {
        throw new BadRequestException('Некорректный идентификатор урока');
      }
      updateData.lessonId = new Types.ObjectId(updateHomeworkDto.lessonId);
    }

    if (updateHomeworkDto.description !== undefined) {
      updateData.description = updateHomeworkDto.description;
    }
    if (updateHomeworkDto.category !== undefined) {
      updateData.category = updateHomeworkDto.category;
    }
    if (updateHomeworkDto.isActive !== undefined) {
      updateData.isActive = updateHomeworkDto.isActive;
    }
    if (updateHomeworkDto.points !== undefined) {
      updateData.points = updateHomeworkDto.points;
    }
    if (updateHomeworkDto.deadline) {
      const deadline = new Date(updateHomeworkDto.deadline);
      if (isNaN(deadline.getTime())) {
        throw new BadRequestException('Некорректный формат даты дедлайна');
      }
      updateData.deadline = deadline;
    }

    const updatedHomework = await this.homeworkModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedHomework) {
      throw new NotFoundException('Домашнее задание не найдено');
    }

    await this.cacheManager.del(`homework:${id}`);
    await this.cacheManager.del(
      `homeworks:lesson:${updatedHomework.lessonId.toString()}`,
    );

    this.logger.log(`Обновлено домашнее задание с ID: ${id}`);
    return updatedHomework;
  }

  async deleteHomework(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }

    const homework = await this.homeworkModel.findByIdAndDelete(id).exec();
    if (!homework) {
      throw new NotFoundException('Домашнее задание не найдено');
    }

    await this.cacheManager.del(`homework:${id}`);
    await this.cacheManager.del(
      `homeworks:lesson:${homework.lessonId.toString()}`,
    );
    this.logger.log(`Удалено домашнее задание с ID: ${id}`);
  }

  async findHomeworkById(id: string): Promise<Homework | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }

    const cacheKey = `homework:${id}`;
    const cachedHomework = await this.cacheManager.get<Homework>(cacheKey);
    if (cachedHomework) {
      this.logger.debug(`Найдено домашнее задание в кэше: ${id}`);
      return cachedHomework;
    }

    const homework = await this.homeworkModel.findById(id).lean().exec();
    if (homework) {
      await this.cacheManager.set(cacheKey, homework, 3600);
      this.logger.debug(`Найдено домашнее задание в базе: ${id}`);
    }
    return homework;
  }

  async findHomeworksByLesson(lessonId: string): Promise<Homework[]> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('Некорректный идентификатор урока');
    }

    const cacheKey = `homeworks:lesson:${lessonId}`;
    const cachedHomeworks = await this.cacheManager.get<Homework[]>(cacheKey);
    if (cachedHomeworks) {
      this.logger.debug(
        `Найдены домашние задания в кэше для урока: ${lessonId}`,
      );
      return cachedHomeworks;
    }

    const objectId = new Types.ObjectId(lessonId);
    const homeworks = await this.homeworkModel
      .find({ lessonId: objectId })
      .lean()
      .exec();

    if (homeworks.length > 0) {
      await this.cacheManager.set(cacheKey, homeworks, 3600);
      this.logger.debug(
        `Найдены домашние задания в базе для урока: ${lessonId}`,
      );
    }
    return homeworks;
  }

  // Методы для решений
  async createSubmission(
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<SubmissionDocument> {
    if (!Types.ObjectId.isValid(createSubmissionDto.homeworkId)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }
    if (!Types.ObjectId.isValid(createSubmissionDto.studentId)) {
      throw new BadRequestException('Некорректный идентификатор студента');
    }

    const newSubmission = new this.submissionModel({
      ...createSubmissionDto,
      homeworkId: new Types.ObjectId(createSubmissionDto.homeworkId),
      studentId: new Types.ObjectId(createSubmissionDto.studentId),
    });
    const savedSubmission: SubmissionDocument = await newSubmission.save();

    const homework = await this.findHomeworkById(
      createSubmissionDto.homeworkId,
    );
    if (!homework) throw new NotFoundException('Домашнее задание не найдено');

    const course = await this.coursesService.findCourseByLesson(
      homework.lessonId.toString(),
    );
    if (!course) throw new NotFoundException('Курс не найден для этого урока');

    const pointsAwarded = homework.points || 10;
    const updatedEnrollment = await this.enrollmentsService.awardPoints(
      createSubmissionDto.studentId,
      course._id.toString(),
      pointsAwarded,
    );

    if (updatedEnrollment) {
      this.logger.log(
        `Начислено ${pointsAwarded} баллов за домашнее задание ${homework._id}`,
      );
      const template = await this.notificationsService.getNotificationByKey(
        'homework_submission',
      );
      const message = this.notificationsService.replacePlaceholders(
        template.message,
        {
          points: pointsAwarded,
          description: homework.description,
        },
      );
      const notification = await this.notificationsService.createNotification({
        userId: createSubmissionDto.studentId,
        message,
        title: template.title,
      });
      if (!notification._id)
        throw new Error('Идентификатор уведомления отсутствует');
      await this.notificationsService.sendNotificationToUser(
        notification._id.toString(),
        createSubmissionDto.studentId,
      );
    }

    // Явное приведение типа для _id
    const submissionId = (savedSubmission._id as Types.ObjectId).toString();
    await this.cacheManager.del(`submission:${submissionId}`);
    await this.cacheManager.del(
      `submissions:homework:${createSubmissionDto.homeworkId}`,
    );
    await this.cacheManager.del(
      `submissions:student:${createSubmissionDto.studentId}`,
    );

    this.logger.log(`Создано решение с ID: ${savedSubmission._id}`);
    return savedSubmission;
  }

  async updateSubmission(
    id: string,
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<SubmissionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный идентификатор решения');
    }

    const updatedSubmission = await this.submissionModel
      .findByIdAndUpdate(id, updateSubmissionDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedSubmission) {
      throw new NotFoundException('Решение не найдено');
    }

    await this.cacheManager.del(`submission:${id}`);
    await this.cacheManager.del(
      `submissions:homework:${updatedSubmission.homeworkId.toString()}`,
    );
    await this.cacheManager.del(
      `submissions:student:${updatedSubmission.studentId.toString()}`,
    );

    this.logger.log(`Обновлено решение с ID: ${id}`);
    return updatedSubmission;
  }

  async findSubmissionById(id: string): Promise<Submission | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный идентификатор решения');
    }

    const cacheKey = `submission:${id}`;
    const cachedSubmission = await this.cacheManager.get<Submission>(cacheKey);
    if (cachedSubmission) {
      this.logger.debug(`Найдено решение в кэше: ${id}`);
      return cachedSubmission;
    }

    const submission = await this.submissionModel.findById(id).lean().exec();
    if (submission) {
      await this.cacheManager.set(cacheKey, submission, 3600);
      this.logger.debug(`Найдено решение в базе: ${id}`);
    }
    return submission;
  }

  async findSubmissionsByHomework(homeworkId: string): Promise<Submission[]> {
    if (!Types.ObjectId.isValid(homeworkId)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }

    const cacheKey = `submissions:homework:${homeworkId}`;
    const cachedSubmissions =
      await this.cacheManager.get<Submission[]>(cacheKey);
    if (cachedSubmissions) {
      this.logger.debug(
        `Найдены решения в кэше для домашнего задания: ${homeworkId}`,
      );
      return cachedSubmissions;
    }

    const objectId = new Types.ObjectId(homeworkId);
    const submissions = await this.submissionModel
      .find({ homeworkId: objectId })
      .lean()
      .exec();

    if (submissions.length > 0) {
      await this.cacheManager.set(cacheKey, submissions, 3600);
      this.logger.debug(
        `Найдены решения в базе для домашнего задания: ${homeworkId}`,
      );
    }
    return submissions;
  }

  async findSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Некорректный идентификатор студента');
    }

    const cacheKey = `submissions:student:${studentId}`;
    const cachedSubmissions =
      await this.cacheManager.get<Submission[]>(cacheKey);
    if (cachedSubmissions) {
      this.logger.debug(`Найдены решения в кэше для студента: ${studentId}`);
      return cachedSubmissions;
    }

    const objectId = new Types.ObjectId(studentId);
    const submissions = await this.submissionModel
      .find({ studentId: objectId })
      .lean()
      .exec();

    if (submissions.length > 0) {
      await this.cacheManager.set(cacheKey, submissions, 3600);
      this.logger.debug(`Найдены решения в базе для студента: ${studentId}`);
    }
    return submissions;
  }

  async checkDeadlines(): Promise<void> {
    const cacheKey = 'homeworks:deadlines';
    const cachedDeadlines = await this.cacheManager.get<{
      [key: string]: number;
    }>(cacheKey);
    if (cachedDeadlines) {
      this.logger.debug('Дедлайны найдены в кэше');
      for (const [homeworkId, daysLeft] of Object.entries(cachedDeadlines)) {
        if (daysLeft <= 7 && daysLeft > 0) {
          const homework = await this.findHomeworkById(homeworkId);
          if (homework) {
            const course = await this.coursesService.findCourseByLesson(
              homework.lessonId.toString(),
            );
            await this.notificationsService.notifyDeadline(
              homeworkId,
              daysLeft,
              `Домашнее задание для ${course?.title || 'Неизвестный курс'}: ${homework.description}`,
            );
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

      const daysLeft = Math.ceil(
        (homework.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      deadlineCache[homework._id.toString()] = daysLeft;

      const course = await this.coursesService.findCourseByLesson(
        homework.lessonId.toString(),
      );

      if (daysLeft <= 7 && daysLeft > 0) {
        await this.notificationsService.notifyDeadline(
          homework._id.toString(),
          daysLeft,
          `Домашнее задание для ${course?.title || 'Неизвестный курс'}: ${homework.description}`,
        );
      }
    }

    await this.cacheManager.set(cacheKey, deadlineCache, 3600);
    this.logger.log('Проверка дедлайнов завершена');
  }

  async autoCheckSubmission(
    submissionId: string,
  ): Promise<{ grade: number; comment: string }> {
    if (!Types.ObjectId.isValid(submissionId)) {
      throw new BadRequestException('Некорректный идентификатор решения');
    }

    const cacheKey = `submission:check:${submissionId}`;
    const cachedResult = await this.cacheManager.get<{
      grade: number;
      comment: string;
    }>(cacheKey);
    if (cachedResult) {
      this.logger.debug(
        `Результат автопроверки найден в кэше: ${submissionId}`,
      );
      return cachedResult;
    }

    const submission = await this.submissionModel.findById(submissionId).exec();
    if (!submission) throw new NotFoundException('Решение не найдено');

    // Пример логики автопроверки
    const correctAnswers = 10;
    const submittedAnswers = submission.submissionContent
      .split(',')
      .filter(Boolean).length;
    const grade = Math.min(100, (submittedAnswers / correctAnswers) * 100);
    const comment = `Автопроверка: ${grade}% на основе ${submittedAnswers} правильных ответов из ${correctAnswers}.`;

    await this.submissionModel
      .findByIdAndUpdate(submissionId, {
        grade,
        teacherComment: comment,
        isReviewed: true,
      })
      .exec();

    const homework = await this.findHomeworkById(
      submission.homeworkId.toString(),
    );
    if (!homework) throw new NotFoundException('Домашнее задание не найдено');

    const course = await this.coursesService.findCourseByLesson(
      homework.lessonId.toString(),
    );
    if (!course) throw new NotFoundException('Курс не найден');

    const courseStructure = await this.coursesService.getCourseStructure(
      course._id.toString(),
    );
    const lesson = courseStructure.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.lessonId.toString() === homework.lessonId.toString());
    if (!lesson)
      throw new NotFoundException('Урок не найден в структуре курса');

    const module = courseStructure.modules.find((m) =>
      m.lessons.some(
        (l) => l.lessonId.toString() === lesson.lessonId.toString(),
      ),
    );
    if (!module)
      throw new NotFoundException('Модуль не найден в структуре курса');

    await this.enrollmentsService.updateStudentProgress(
      submission.studentId.toString(),
      course._id.toString(),
      module.moduleId.toString(),
      lesson.lessonId.toString(),
    );

    const enrollment = await this.enrollmentsService.findEnrollmentsByStudent(
      submission.studentId.toString(),
    );
    const relatedEnrollment = enrollment.find(
      (e) => e.courseId.toString() === course._id.toString(),
    );
    if (!relatedEnrollment) {
      throw new NotFoundException(
        'Запись на курс не найдена для этого решения',
      );
    }

    const template =
      await this.notificationsService.getNotificationByKey('progress_points');
    const message = this.notificationsService.replacePlaceholders(
      template.message,
      {
        points: grade,
        action: `автопроверка решения ${submissionId}`,
      },
    );
    const notification = await this.notificationsService.createNotification({
      userId: submission.studentId.toString(),
      message,
      title: template.title,
    });
    if (!notification._id)
      throw new Error('Идентификатор уведомления отсутствует');
    await this.notificationsService.sendNotificationToUser(
      notification._id.toString(),
      submission.studentId.toString(),
    );

    await this.cacheManager.del(`submission:${submissionId}`);
    await this.cacheManager.del(
      `submissions:homework:${submission.homeworkId.toString()}`,
    );
    await this.cacheManager.del(
      `submissions:student:${submission.studentId.toString()}`,
    );

    const result = { grade, comment };
    await this.cacheManager.set(cacheKey, result, 3600);
    this.logger.log(
      `Автопроверка решения ${submissionId} завершена с оценкой ${grade}`,
    );
    return result;
  }

  async checkDeadlineNotifications(homeworkId: string): Promise<void> {
    if (!Types.ObjectId.isValid(homeworkId)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }

    const cacheKey = `deadline:notifications:${homeworkId}`;
    const cachedNotifications = await this.cacheManager.get<any>(cacheKey);
    if (cachedNotifications) {
      this.logger.debug(`Уведомления о дедлайне найдены в кэше: ${homeworkId}`);
      return;
    }

    const homework = await this.homeworkModel
      .findById(homeworkId)
      .lean()
      .exec();
    if (!homework) throw new NotFoundException('Домашнее задание не найдено');

    const now = new Date();
    const deadline = homework.deadline
      ? new Date(homework.deadline)
      : undefined;
    if (!deadline)
      throw new BadRequestException('Дедлайн не указан для домашнего задания');

    if (now > deadline) {
      const submissions = await this.submissionModel
        .find({ homeworkId: homework._id })
        .lean()
        .exec();
      const lateSubmissions = submissions.filter(
        (s) => !s.isReviewed && new Date(s.createdAt) > deadline,
      );

      if (lateSubmissions.length > 0) {
        await Promise.all(
          lateSubmissions.map(async (submission) => {
            const studentTemplate =
              await this.notificationsService.getNotificationByKey(
                'late_submission',
              );
            const studentMessage =
              this.notificationsService.replacePlaceholders(
                studentTemplate.message,
                { homeworkId },
              );
            const studentNotification =
              await this.notificationsService.createNotification({
                userId: submission.studentId.toString(),
                message: studentMessage,
                title: studentTemplate.title,
              });
            if (!studentNotification._id)
              throw new Error('Идентификатор уведомления отсутствует');
            await this.notificationsService.sendNotificationToUser(
              studentNotification._id.toString(),
              submission.studentId.toString(),
            );

            const adminTemplate =
              await this.notificationsService.getNotificationByKey(
                'admin_late_submission',
              );
            const adminMessage = this.notificationsService.replacePlaceholders(
              adminTemplate.message,
              {
                homeworkId,
                studentId: submission.studentId.toString(),
              },
            );
            const adminNotification =
              await this.notificationsService.createNotification({
                userId: 'admin',
                message: adminMessage,
                title: adminTemplate.title,
              });
            if (!adminNotification._id)
              throw new Error('Идентификатор уведомления отсутствует');
            await this.notificationsService.sendNotificationToUser(
              adminNotification._id.toString(),
              'admin',
            );
          }),
        );
      }

      await this.cacheManager.set(cacheKey, { checked: true }, 3600);
      this.logger.log(
        `Проверка уведомлений о дедлайне для ${homeworkId} завершена`,
      );
    }
  }

  async getSubmissionsByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Submission[]> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException(
        'Некорректный идентификатор студента или курса',
      );
    }

    const submissions = await this.submissionModel
      .find({ studentId })
      .populate({
        path: 'homeworkId',
        match: { courseId: new Types.ObjectId(courseId) },
      })
      .lean()
      .exec();
    return submissions.filter((s) => s.homeworkId);
  }

  async getHomeworksByCourse(courseId: string): Promise<Homework[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный идентификатор курса');
    }

    const lessons = await this.coursesService.getLessonsForCourse(courseId);
    return this.homeworkModel
      .find({ lessonId: { $in: lessons } })
      .lean()
      .exec();
  }

  async getSubmissionsByCourse(courseId: string): Promise<Submission[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный идентификатор курса');
    }

    const homeworks = await this.getHomeworksByCourse(courseId);
    return this.submissionModel
      .find({ homeworkId: { $in: homeworks.map((h) => h._id) } })
      .lean()
      .exec();
  }
}
