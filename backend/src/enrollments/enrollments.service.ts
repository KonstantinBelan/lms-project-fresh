import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { Tariff, TariffDocument } from '../tariffs/schemas/tariff.schema';
import {
  IEnrollmentsService,
  DetailedStudentProgress,
} from './enrollments.service.interface';
import { StudentProgress } from './dto/progress.dto';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import { HomeworksService } from '../homeworks/homeworks.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailerService } from '../mailer/mailer.service';
import { StreamsService } from '../streams/streams.service';
import { TariffsService } from '../tariffs/tariffs.service';
import { AlreadyEnrolledException } from './exceptions/already-enrolled.exception';
import { BatchEnrollmentDto } from './dto/batch-enrollment.dto';
import { stringify } from 'csv-stringify/sync';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Lesson } from '../courses/schemas/lesson.schema';

@Injectable()
export class EnrollmentsService implements IEnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(forwardRef(() => HomeworksService))
    private homeworksService: HomeworksService,
    private readonly quizzesService: QuizzesService,
    private usersService: UsersService,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @Inject(forwardRef(() => StreamsService))
    private streamsService: StreamsService,
    @Inject(forwardRef(() => TariffsService))
    private tariffsService: TariffsService,
    private readonly mailerService: MailerService,
  ) {
    this.logger.debug('Конструктор EnrollmentsService вызван');
    this.logger.debug(`Модель Enrollment: ${!!this.enrollmentModel}`);
    this.logger.debug(`Менеджер кэша: ${!!this.cacheManager}`);
    this.logger.debug(`Сервис пользователей: ${!!this.usersService}`);
    this.logger.debug(`Сервис курсов: ${!!this.coursesService}`);
    this.logger.debug(`Сервис уведомлений: ${!!this.notificationsService}`);
    this.logger.debug(`Очередь уведомлений: ${!!this.notificationsQueue}`);
    this.logger.debug(`Сервис потоков: ${!!this.streamsService}`);
    this.logger.debug(`Сервис тарифов: ${!!this.tariffsService}`);
  }

  // Приватный метод для отправки уведомлений о зачислении
  private async sendEnrollmentNotifications(
    studentId: string,
    courseId: string,
    deadline?: Date,
  ): Promise<void> {
    const student = await this.usersService.findById(studentId);
    const course = await this.coursesService.findCourseById(courseId);
    if (!student || !course) return;

    if (!student.settings?.notifications) return;

    const telegramPromises = [
      (async () => {
        const template =
          await this.notificationsService.getNotificationByKey('new_course');
        const message = this.notificationsService.replacePlaceholders(
          template.message,
          {
            courseTitle: course.title,
            courseId,
          },
        );
        const notif = await this.notificationsService.createNotification({
          userId: studentId,
          message,
          title: template.title,
        });
        if (notif?._id) {
          await this.notificationsService.sendNotificationToUser(
            notif._id.toString(),
            studentId,
          );
        }
      })(),
      deadline &&
        (async () => {
          const daysLeft = Math.ceil(
            (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysLeft <= 7 && daysLeft > 0) {
            const template =
              await this.notificationsService.getNotificationByKey(
                'deadline_reminder',
              );
            const message = this.notificationsService.replacePlaceholders(
              template.message,
              {
                courseTitle: course.title,
                daysLeft,
              },
            );
            const notif = await this.notificationsService.createNotification({
              userId: studentId,
              message,
              title: template.title,
            });
            if (notif?._id) {
              await this.notificationsService.sendNotificationToUser(
                notif._id.toString(),
                studentId,
              );
            }
          }
        })(),
    ];

    const emailPromises = [
      this.mailerService.sendInstantMail(
        student.email,
        'Добро пожаловать на курс!',
        'welcome',
        {
          name: student.name,
          courseTitle: course.title,
          courseUrl: `http://localhost:3000/courses/${courseId}`,
        },
      ),
      deadline &&
        (async () => {
          const daysLeft = Math.ceil(
            (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysLeft <= 7 && daysLeft > 0) {
            await this.mailerService.sendInstantMail(
              student.email,
              'Напоминание о дедлайне',
              'deadline-reminder',
              {
                name: student.name,
                courseTitle: course.title,
                daysLeft,
                courseUrl: `http://localhost:3000/courses/${courseId}`,
              },
            );
          }
        })(),
    ];

    await Promise.all([...telegramPromises, ...emailPromises]);
    this.logger.debug(
      `Уведомления отправлены для студента ${studentId} на курс ${courseId}`,
    );
  }

  // Создание нового зачисления
  async createEnrollment(
    studentId: string,
    courseId: string,
    deadline?: Date,
    streamId?: string,
    tariffId?: string,
    skipNotifications = false,
  ): Promise<EnrollmentDocument> {
    const start = Date.now();

    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Некорректный studentId или courseId');
    }

    const studentObjectId = new Types.ObjectId(studentId);
    const courseObjectId = new Types.ObjectId(courseId);

    const [student, course] = await Promise.all([
      this.usersService.findById(studentId),
      this.coursesService.findCourseById(courseId),
    ]);
    this.logger.debug(`Поиск студента и курса: ${Date.now() - start}мс`);

    if (!student) throw new NotFoundException('Студент не найден');
    if (!course) throw new NotFoundException('Курс не найден');

    const existingEnrollment = await this.enrollmentModel
      .findOne({ studentId: studentObjectId, courseId: courseObjectId })
      .lean()
      .exec();
    if (existingEnrollment) {
      this.logger.warn(`Студент ${studentId} уже зачислен на курс ${courseId}`);
      throw new AlreadyEnrolledException();
    }

    if (streamId || tariffId) {
      const [stream, tariff] = await Promise.all([
        streamId && Types.ObjectId.isValid(streamId)
          ? this.streamsService.findStreamById(streamId)
          : Promise.resolve(null),
        tariffId && Types.ObjectId.isValid(tariffId)
          ? this.tariffsService.findTariffById(tariffId)
          : Promise.resolve(null),
      ]);
      if (streamId && (!stream || stream.courseId.toString() !== courseId)) {
        throw new BadRequestException(
          'Поток не найден или не относится к этому курсу',
        );
      }
      if (tariffId && (!tariff || tariff.courseId.toString() !== courseId)) {
        throw new BadRequestException(
          'Тариф не найден или не относится к этому курсу',
        );
      }
    }

    const newEnrollment = new this.enrollmentModel({
      studentId: studentObjectId,
      courseId: courseObjectId,
      streamId: streamId ? new Types.ObjectId(streamId) : undefined,
      tariffId: tariffId ? new Types.ObjectId(tariffId) : undefined,
      deadline,
      completedModules: [],
      completedLessons: [],
      points: 0,
      isCompleted: false,
    });
    const savedEnrollment = await newEnrollment.save();
    this.logger.debug(`Сохранение зачисления: ${Date.now() - start}мс`);

    if (streamId) {
      try {
        await this.streamsService.addStudentToStream(streamId, studentId);
      } catch (error) {
        if (error instanceof BadRequestException) {
          this.logger.warn(`Студент ${studentId} уже в потоке ${streamId}`);
        } else {
          throw error;
        }
      }
    }

    if (!skipNotifications) {
      await this.sendEnrollmentNotifications(studentId, courseId, deadline);
    }

    await Promise.all([
      this.cacheManager.del(`enrollment:${savedEnrollment._id.toString()}`),
      this.cacheManager.del(`enrollments:student:${studentId}`),
      this.cacheManager.del(`enrollments:course:${courseId}`),
    ]);
    this.logger.debug(`Очистка кэша: ${Date.now() - start}мс`);

    this.logger.debug(`Общее время выполнения: ${Date.now() - start}мс`);
    return savedEnrollment;
  }

  // Массовое создание зачислений
  async createBatchEnrollments(
    batchEnrollmentDto: BatchEnrollmentDto,
  ): Promise<EnrollmentDocument[]> {
    const { studentIds, courseIds, deadlines, streamIds } = batchEnrollmentDto;

    if (studentIds.length !== courseIds.length) {
      throw new BadRequestException(
        'Количество studentIds должно совпадать с количеством courseIds',
      );
    }
    if (streamIds && streamIds.length !== studentIds.length) {
      throw new BadRequestException(
        'Количество streamIds должно совпадать с количеством studentIds',
      );
    }
    if (deadlines && deadlines.length !== studentIds.length) {
      throw new BadRequestException(
        'Количество deadlines должно совпадать с количеством studentIds',
      );
    }

    const enrollments: EnrollmentDocument[] = [];

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const courseId = courseIds[i];
      const deadlineStr = deadlines?.[i];
      const streamId = streamIds?.[i];
      let deadline: Date | undefined;

      if (deadlineStr) {
        deadline = new Date(deadlineStr);
        if (isNaN(deadline.getTime())) {
          this.logger.warn(
            `Некорректный формат даты для дедлайна ${deadlineStr} на индексе ${i}`,
          );
          deadline = undefined;
        }
      }

      try {
        const enrollment = await this.createEnrollment(
          studentId,
          courseId,
          deadline,
          streamId,
        );
        enrollments.push(enrollment);
      } catch (error) {
        this.logger.error(
          `Не удалось создать зачисление для студента ${studentId} на курс ${courseId}: ${error.message}`,
        );
      }
    }

    return enrollments;
  }

  // Поиск зачислений по идентификатору студента
  async findEnrollmentsByStudent(
    studentId: string,
  ): Promise<EnrollmentDocument[]> {
    const cacheKey = `enrollments:student:${studentId}`;
    const cachedEnrollments =
      await this.cacheManager.get<EnrollmentDocument[]>(cacheKey);
    if (cachedEnrollments) {
      this.logger.debug(`Зачисления найдены в кэше для студента ${studentId}`);
      return cachedEnrollments;
    }

    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Некорректный studentId');
    }

    const enrollments = await this.enrollmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .lean()
      .exec();
    await this.cacheManager.set(cacheKey, enrollments, 3600);
    this.logger.debug(`Зачисления найдены в БД для студента ${studentId}`);
    return enrollments;
  }

  // Поиск зачисления по студенту и курсу
  async findEnrollmentByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentDocument | null> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Некорректный studentId или courseId');
    }

    return this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .lean()
      .exec();
  }

  // Поиск зачислений по идентификатору курса
  async findEnrollmentsByCourse(courseId: string): Promise<any[]> {
    const cacheKey = `enrollments:course:${courseId}`;
    const cachedEnrollments = await this.cacheManager.get<any[]>(cacheKey);
    if (cachedEnrollments) {
      this.logger.debug(`Зачисления найдены в кэше для курса ${courseId}`);
      return cachedEnrollments;
    }

    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный courseId');
    }

    const enrollments = await this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();
    if (!enrollments.length) return [];

    const course = await this.coursesService.findCourseById(courseId);
    if (!course) throw new BadRequestException('Курс не найден');

    const totalLessons =
      await this.coursesService.getTotalLessonsForCourse(courseId);
    const totalModules = course.modules.length;

    const enrichedEnrollments = enrollments.map((enrollment) => ({
      studentId: enrollment.studentId.toString(),
      completedModules: enrollment.completedModules.length,
      totalModules,
      completedLessons: enrollment.completedLessons.length,
      totalLessons,
      points: enrollment.points,
      completionPercentage:
        totalLessons > 0
          ? Math.round(
              (enrollment.completedLessons.length / totalLessons) * 100,
            )
          : 0,
      grade: enrollment.grade,
      isCompleted: enrollment.isCompleted,
      deadline: enrollment.deadline ? enrollment.deadline.toISOString() : null,
    }));

    await this.cacheManager.set(cacheKey, enrichedEnrollments, 3600);
    this.logger.debug(`Обогащенные зачисления для курса ${courseId}`);
    return enrichedEnrollments;
  }

  // Поиск зачисления по идентификатору
  async findEnrollmentById(
    enrollmentId: string,
  ): Promise<EnrollmentDocument | null> {
    const cacheKey = `enrollment:${enrollmentId}`;
    const cachedEnrollment =
      await this.cacheManager.get<EnrollmentDocument>(cacheKey);
    if (cachedEnrollment) {
      this.logger.debug(`Зачисление найдено в кэше: ${enrollmentId}`);
      return cachedEnrollment;
    }

    if (!Types.ObjectId.isValid(enrollmentId)) {
      throw new BadRequestException('Некорректный enrollmentId');
    }

    const enrollment = await this.enrollmentModel
      .findById(enrollmentId)
      .lean()
      .exec();
    if (enrollment) await this.cacheManager.set(cacheKey, enrollment, 3600);
    this.logger.debug(`Зачисление найдено в БД: ${enrollmentId}`);
    return enrollment;
  }

  // Обновление прогресса студента
  async updateStudentProgress(
    studentId: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      throw new BadRequestException(
        'Некорректный studentId, courseId, moduleId или lessonId',
      );
    }

    const enrollment = await this.enrollmentModel
      .findOneAndUpdate(
        {
          studentId: new Types.ObjectId(studentId),
          courseId: new Types.ObjectId(courseId),
        },
        {
          $addToSet: {
            completedLessons: lessonId,
            completedModules: moduleId,
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!enrollment) {
      this.logger.warn(
        `Зачисление не найдено для студента ${studentId} на курсе ${courseId}`,
      );
      return null;
    }

    await Promise.all([
      this.cacheManager.del(`enrollment:${enrollment._id.toString()}`),
      this.cacheManager.del(`enrollments:student:${studentId}`),
      this.cacheManager.del(`enrollments:course:${courseId}`),
    ]);
    this.logger.debug(
      `Прогресс студента обновлен: ${studentId} на курсе ${courseId}`,
    );
    return enrollment;
  }

  // Завершение урока и начисление баллов
  async completeLesson(
    studentId: string,
    courseId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      throw new BadRequestException(
        'Некорректный studentId, courseId или lessonId',
      );
    }

    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .exec();
    if (!enrollment) throw new BadRequestException('Зачисление не найдено');

    const lesson = await this.lessonModel.findById(lessonId).lean().exec();
    if (!lesson) throw new BadRequestException('Урок не найден');

    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
      const pointsAwarded = lesson.points || 1;
      enrollment.points = (enrollment.points || 0) + pointsAwarded;
      await enrollment.save();

      await Promise.all([
        this.cacheManager.del(`enrollment:${enrollment._id.toString()}`),
        this.cacheManager.del(`enrollments:student:${studentId}`),
        this.cacheManager.del(`enrollments:course:${courseId}`),
      ]);
      this.logger.debug(
        `Начислено ${pointsAwarded} баллов за урок ${lessonId}`,
      );

      const student = await this.usersService.findById(studentId);
      if (!student) throw new NotFoundException('Студент не найден');

      const template =
        await this.notificationsService.getNotificationByKey('progress_points');
      const message = this.notificationsService.replacePlaceholders(
        template.message,
        {
          points: pointsAwarded,
          action: `завершение урока "${lesson.title}"`,
        },
      );
      const notification = await this.notificationsService.createNotification({
        userId: studentId,
        message,
        title: template.title,
      });
      if (!notification._id)
        throw new Error('Идентификатор уведомления отсутствует');
      await this.notificationsService.sendNotificationToUser(
        notification._id.toString(),
        studentId,
      );
    }

    return enrollment;
  }

  // Начисление баллов студенту
  async awardPoints(
    studentId: string,
    courseId: string,
    points: number,
  ): Promise<EnrollmentDocument> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Некорректный studentId или courseId');
    }

    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .populate('tariffId')
      .exec();
    if (!enrollment) throw new NotFoundException('Зачисление не найдено');
    if (enrollment.isCompleted)
      throw new BadRequestException('Курс уже завершен');

    const tariff = enrollment.tariffId as TariffDocument | undefined;
    if (tariff && !tariff.includesPoints) {
      this.logger.debug(
        `Баллы не начислены для ${studentId} из-за ограничений тарифа`,
      );
      return enrollment;
    }

    enrollment.points = (enrollment.points || 0) + points;
    await enrollment.save();

    await Promise.all([
      this.cacheManager.del(`enrollment:${enrollment._id.toString()}`),
      this.cacheManager.del(`enrollments:student:${studentId}`),
      this.cacheManager.del(`enrollments:course:${courseId}`),
    ]);
    this.logger.debug(
      `Начислено ${points} баллов для зачисления ${enrollment._id}`,
    );
    return enrollment;
  }

  // Получение прогресса студента по курсу
  async getStudentProgress(
    studentId: string,
    courseId: string,
  ): Promise<StudentProgress> {
    const cacheKey = `progress:student:${studentId}:course:${courseId}`;
    const cachedProgress =
      await this.cacheManager.get<StudentProgress>(cacheKey);
    if (cachedProgress) {
      this.logger.debug(`Прогресс найден в кэше для студента ${studentId}`);
      return cachedProgress;
    }

    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Некорректный studentId или courseId');
    }

    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .lean()
      .exec();
    if (!enrollment) throw new BadRequestException('Зачисление не найдено');

    const course = await this.coursesService.findCourseById(courseId);
    if (!course) throw new BadRequestException('Курс не найден');

    const totalModules = course.modules.length || 0;
    const totalLessons =
      await this.coursesService.getTotalLessonsForCourse(courseId);

    const homeworkSubmissions =
      await this.homeworksService.getSubmissionsByStudentAndCourse(
        studentId,
        courseId,
      );
    const quizSubmissions =
      await this.quizzesService.getSubmissionsByStudentAndCourse(
        studentId,
        courseId,
      );

    const avgHomeworkGrade = homeworkSubmissions.length
      ? homeworkSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) /
        homeworkSubmissions.length
      : 0;
    const avgQuizScore = quizSubmissions.length
      ? quizSubmissions.reduce((sum, s) => sum + s.score, 0) /
        quizSubmissions.length
      : 0;

    const progress: StudentProgress = {
      studentId,
      courseId,
      completedModules: enrollment.completedModules.length,
      totalModules,
      completedLessons: enrollment.completedLessons.length,
      totalLessons,
      points: enrollment.points || 0,
      completionPercentage:
        totalLessons > 0
          ? Math.round(
              (enrollment.completedLessons.length / totalLessons) * 100,
            )
          : 0,
      completedModuleIds: enrollment.completedModules,
      completedLessonIds: enrollment.completedLessons,
      avgHomeworkGrade: Number(avgHomeworkGrade.toFixed(2)),
      avgQuizScore: Number(avgQuizScore.toFixed(2)),
    };

    await this.cacheManager.set(cacheKey, progress, 3600);
    this.logger.debug(
      `Рассчитан прогресс студента ${studentId} для курса ${courseId}`,
    );
    return progress;
  }

  // Получение детального прогресса студента
  async getDetailedStudentProgress(
    studentId: string,
  ): Promise<DetailedStudentProgress> {
    const cacheKey = `detailed-progress:student:${studentId}`;
    const cachedProgress =
      await this.cacheManager.get<DetailedStudentProgress>(cacheKey);
    if (cachedProgress) {
      this.logger.debug(
        `Детальный прогресс найден в кэше для студента ${studentId}`,
      );
      return cachedProgress;
    }

    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Некорректный studentId');
    }

    const enrollments = await this.findEnrollmentsByStudent(studentId);
    const progress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.courseId.toString();
        const course = await this.coursesService.findCourseById(courseId);

        if (!course) {
          return {
            courseId,
            courseTitle: 'Курс не найден',
            completionPercentage: 0,
            lessonCompletionPercentage: 0,
            completedModules: 0,
            totalModules: 0,
            completedLessons: enrollment.completedLessons.length,
            totalLessons: 0,
            points: enrollment.points || 0,
            grade: enrollment.grade,
            isCompleted: enrollment.isCompleted,
            deadline: enrollment.deadline
              ? enrollment.deadline.toISOString()
              : null,
          };
        }

        const totalModules = course.modules.length || 0;
        const totalLessons =
          await this.coursesService.getTotalLessonsForCourse(courseId);

        return {
          courseId,
          courseTitle: course.title || 'Неизвестно',
          completionPercentage:
            totalModules > 0
              ? Math.round(
                  (enrollment.completedModules.length / totalModules) * 100,
                )
              : 0,
          lessonCompletionPercentage:
            totalLessons > 0
              ? Math.round(
                  (enrollment.completedLessons.length / totalLessons) * 100,
                )
              : 0,
          completedModules: enrollment.completedModules.length,
          totalModules,
          completedLessons: enrollment.completedLessons.length,
          totalLessons,
          points: enrollment.points || 0,
          grade: enrollment.grade,
          isCompleted: enrollment.isCompleted,
          deadline: enrollment.deadline
            ? enrollment.deadline.toISOString()
            : null,
        };
      }),
    );

    const result = { studentId, progress };
    await this.cacheManager.set(cacheKey, result, 3600);
    this.logger.debug(`Рассчитан детальный прогресс студента ${studentId}`);
    return result;
  }

  // Обновление прогресса по идентификатору зачисления
  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null> {
    if (
      !Types.ObjectId.isValid(enrollmentId) ||
      !Types.ObjectId.isValid(moduleId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      throw new BadRequestException(
        'Некорректный enrollmentId, moduleId или lessonId',
      );
    }

    const enrollment = await this.findEnrollmentById(enrollmentId);
    if (!enrollment) throw new BadRequestException('Зачисление не найдено');

    return this.updateStudentProgress(
      enrollment.studentId.toString(),
      enrollment.courseId.toString(),
      moduleId,
      lessonId,
    );
  }

  // Завершение курса
  async completeCourse(
    enrollmentId: string,
    grade: number,
  ): Promise<EnrollmentDocument | null> {
    if (!Types.ObjectId.isValid(enrollmentId)) {
      throw new BadRequestException('Некорректный enrollmentId');
    }

    if (grade < 0 || grade > 100) {
      throw new BadRequestException(
        'Оценка должна быть в диапазоне от 0 до 100',
      );
    }

    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) throw new NotFoundException('Зачисление не найдено');

    const course = await this.coursesService.findCourseById(
      enrollment.courseId.toString(),
    );
    if (!course) throw new NotFoundException('Курс не найден');

    const totalLessons = await this.coursesService.getTotalLessonsForCourse(
      enrollment.courseId.toString(),
    );
    const totalModules = course.modules.length;

    if (
      enrollment.completedLessons.length < totalLessons ||
      enrollment.completedModules.length < totalModules
    ) {
      throw new BadRequestException(
        'Курс не может быть завершен: не все уроки или модули выполнены',
      );
    }

    enrollment.isCompleted = true;
    enrollment.grade = grade;
    const updatedEnrollment = await enrollment.save();

    await Promise.all([
      this.cacheManager.del(`enrollment:${enrollmentId}`),
      this.cacheManager.del(
        `enrollments:student:${enrollment.studentId.toString()}`,
      ),
      this.cacheManager.del(
        `enrollments:course:${enrollment.courseId.toString()}`,
      ),
    ]);
    this.logger.debug(`Курс завершен для зачисления ${enrollmentId}`);
    return updatedEnrollment;
  }

  // Удаление зачисления
  async deleteEnrollment(enrollmentId: string): Promise<void> {
    if (!Types.ObjectId.isValid(enrollmentId)) {
      throw new BadRequestException('Некорректный enrollmentId');
    }

    const enrollment = await this.enrollmentModel.findById(enrollmentId).exec();
    if (!enrollment) throw new NotFoundException('Зачисление не найдено');

    await Promise.all([
      this.cacheManager.del(`enrollment:${enrollmentId}`),
      this.cacheManager.del(`enrollments:student:${enrollment.studentId}`),
      this.cacheManager.del(`enrollments:course:${enrollment.courseId}`),
    ]);
    await this.enrollmentModel.findByIdAndDelete(enrollmentId).exec();
    this.logger.debug(`Зачисление ${enrollmentId} удалено`);
  }

  // Уведомление о прогрессе
  async notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void> {
    if (
      !Types.ObjectId.isValid(enrollmentId) ||
      !Types.ObjectId.isValid(moduleId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      throw new BadRequestException(
        'Некорректный enrollmentId, moduleId или lessonId',
      );
    }

    const enrollment = await this.findEnrollmentById(enrollmentId);
    if (!enrollment) throw new BadRequestException('Зачисление не найдено');

    await Promise.all([
      this.cacheManager.del(`enrollment:${enrollmentId}`),
      this.cacheManager.del(
        `enrollments:student:${enrollment.studentId.toString()}`,
      ),
      this.cacheManager.del(
        `enrollments:course:${enrollment.courseId.toString()}`,
      ),
    ]);

    await this.notificationsService.notifyProgress(
      enrollment.studentId.toString(),
      moduleId,
      lessonId,
    );
    this.logger.debug(`Уведомление о прогрессе отправлено для ${enrollmentId}`);
  }

  // Экспорт зачислений в CSV
  async exportEnrollmentsToCsv(): Promise<string> {
    const cacheKey = 'enrollments:csv';
    const cachedCsv = await this.cacheManager.get<string>(cacheKey);
    if (cachedCsv) {
      this.logger.debug('CSV найден в кэше');
      return cachedCsv;
    }

    const enrollments = await this.enrollmentModel.find().lean().exec();
    const csvData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await this.usersService.findById(
          enrollment.studentId.toString(),
        );
        const course = await this.coursesService.findCourseById(
          enrollment.courseId.toString(),
        );

        return {
          enrollmentId: enrollment._id.toString(),
          studentId: enrollment.studentId.toString(),
          studentEmail: student?.email || 'Неизвестно',
          courseId: enrollment.courseId.toString(),
          courseTitle: course?.title || 'Неизвестно',
          completedModules: enrollment.completedModules.join(','),
          completedLessons: enrollment.completedLessons.join(','),
          points: enrollment.points || 0,
          isCompleted: enrollment.isCompleted,
          grade: enrollment.grade || 'Нет',
          deadline: enrollment.deadline
            ? enrollment.deadline.toISOString()
            : 'Нет',
        };
      }),
    );

    const csv = stringify(csvData, { header: true });
    await this.cacheManager.set(cacheKey, csv, 3600);
    this.logger.debug('Зачисления экспортированы в CSV');
    return csv;
  }

  // Поиск зачислений по идентификатору курса
  async findByCourseId(courseId: string): Promise<Enrollment[]> {
    if (!Types.ObjectId.isValid(courseId))
      throw new BadRequestException('Некорректный courseId');
    return this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();
  }

  // Получение зачислений студента
  async getEnrollmentsByStudent(studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Некорректный studentId');
    }
    return this.enrollmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .lean()
      .exec();
  }

  // Получение зачислений по курсу
  async getEnrollmentsByCourse(courseId: string) {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный courseId');
    }
    return this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();
  }

  // Поиск одного зачисления по студенту и курсу
  async findOneByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentDocument | null> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Некорректный studentId или courseId');
    }
    return this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .populate('tariffId')
      .exec();
  }
}
