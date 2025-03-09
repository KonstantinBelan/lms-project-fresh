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
    private readonly homeworksService: HomeworksService, // Добавляем зависимость
    private readonly quizzesService: QuizzesService, // Добавляем зависимость
    private usersService: UsersService,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService, // Инжектируем CoursesService
    private notificationsService: NotificationsService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>, // Добавляем модель Lesson
    @Inject(forwardRef(() => StreamsService)) // Новая зависимость
    private streamsService: StreamsService,
    @Inject(forwardRef(() => TariffsService))
    private tariffsService: TariffsService,
  ) {
    this.logger.debug('EnrollmentsService constructor called');
    this.logger.debug('EnrollmentModel:', !!this.enrollmentModel);
    this.logger.debug('CacheManager:', !!this.cacheManager);
    this.logger.debug('UsersService:', !!this.usersService);
    this.logger.debug('CoursesService:', !!this.coursesService);
    this.logger.debug('NotificationsService:', !!this.notificationsService);
    this.logger.debug('NotificationsQueue:', !!this.notificationsQueue);
    this.logger.debug('StreamsService:', !!this.streamsService);
    this.logger.debug('TariffsService:', !!this.tariffsService);
  }

  async createEnrollment(
    studentId: string,
    courseId: string,
    deadline?: Date,
    streamId?: string,
    tariffId?: string, // Новый параметр
    skipNotifications = false,
  ): Promise<EnrollmentDocument> {
    const student = await this.usersService.findById(studentId);
    const course = await this.coursesService.findCourseById(courseId);

    if (!student || !course) throw new Error('Student or course not found');

    const existingEnrollment = await this.enrollmentModel
      .findOne({ studentId, courseId })
      .lean()
      .exec();
    if (existingEnrollment) throw new AlreadyEnrolledException();

    if (streamId && !Types.ObjectId.isValid(streamId)) {
      throw new BadRequestException('Invalid streamId');
    }
    if (streamId) {
      const stream = await this.streamsService.findStreamById(streamId);
      if (!stream || stream.courseId.toString() !== courseId) {
        throw new BadRequestException(
          'Stream not found or does not belong to this course',
        );
      }
    }

    if (tariffId && !Types.ObjectId.isValid(tariffId)) {
      throw new BadRequestException('Invalid tariffId');
    }
    if (tariffId) {
      const tariff = await this.tariffsService.findTariffById(tariffId);
      if (!tariff || tariff.courseId.toString() !== courseId) {
        throw new BadRequestException(
          'Tariff not found or does not belong to this course',
        );
      }
    }
    const newEnrollment = new this.enrollmentModel({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      streamId: streamId ? new Types.ObjectId(streamId) : undefined,
      tariffId: tariffId ? new Types.ObjectId(tariffId) : undefined,
      deadline,
      completedModules: [],
      completedLessons: [],
      points: 0,
      isCompleted: false,
    });
    const savedEnrollment = await newEnrollment.save();

    if (streamId) {
      await this.streamsService.addStudentToStream(streamId, studentId);
    }

    if (!skipNotifications) {
      await this.notificationsQueue.add('newCourse', {
        studentId,
        courseId,
        courseTitle: course.title,
        streamId,
        tariffId, // Добавим в уведомление, если нужно
      });
    }

    await this.cacheManager.del(`enrollment:${savedEnrollment._id.toString()}`);
    await this.cacheManager.del(`enrollments:student:${studentId}`);
    await this.cacheManager.del(`enrollments:course:${courseId}`);

    if (deadline) {
      const daysLeft = Math.ceil(
        (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysLeft <= 7 && daysLeft > 0) {
        await this.notificationsService.notifyDeadline(
          savedEnrollment._id.toString(),
          daysLeft,
          course.title,
        );
      }
    }

    return savedEnrollment;
  }

  async createBatchEnrollments(
    batchEnrollmentDto: BatchEnrollmentDto,
  ): Promise<EnrollmentDocument[]> {
    const { studentIds, courseIds, deadlines, streamIds } = batchEnrollmentDto; // Добавляем streamIds

    if (studentIds.length !== courseIds.length) {
      throw new Error('Number of studentIds must match number of courseIds');
    }

    const enrollments: EnrollmentDocument[] = [];

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const courseId = courseIds[i];
      const deadlineStr: string | undefined = deadlines?.[i];
      const streamId: string | undefined = streamIds?.[i]; // Берем streamId из DTO
      let deadline: Date | undefined;

      if (deadlineStr) {
        try {
          deadline = new Date(deadlineStr);
          if (isNaN(deadline.getTime())) {
            this.logger.warn(
              `Invalid date format for deadline ${deadlineStr} at index ${i}, skipping...`,
            );
            deadline = undefined;
          }
        } catch (error) {
          this.logger.error(
            `Failed to parse deadline ${deadlineStr} at index ${i}:`,
            error,
          );
          deadline = undefined;
        }
      }

      try {
        const enrollment = await this.createEnrollment(
          studentId,
          courseId,
          deadline,
          streamId, // Передаем streamId
        );
        enrollments.push(enrollment);
      } catch (error) {
        this.logger.error(
          `Failed to create enrollment for student ${studentId} and course ${courseId}:`,
          error,
        );
      }
    }

    return enrollments;
  }

  async findEnrollmentsByStudent(
    studentId: string,
  ): Promise<EnrollmentDocument[]> {
    const cacheKey = `enrollments:student:${studentId}`;
    const cachedEnrollments =
      await this.cacheManager.get<EnrollmentDocument[]>(cacheKey);
    if (cachedEnrollments) {
      this.logger.debug(
        'Enrollments found in cache for student:',
        cachedEnrollments,
      );
      return cachedEnrollments;
    }

    const objectId = new Types.ObjectId(studentId);
    const enrollments = await this.enrollmentModel
      .find({ studentId: objectId })
      .lean()
      .exec();
    this.logger.debug('Enrollments found in DB for student:', enrollments);
    if (enrollments.length > 0)
      await this.cacheManager.set(cacheKey, enrollments, 3600); // Кэшируем на 1 час
    return enrollments;
  }

  // async findEnrollmentsByStudent(
  //   studentId: string,
  // ): Promise<EnrollmentDocument[]> {
  //   const objectId = new Types.ObjectId(studentId);
  //   const enrollments = await this.enrollmentModel
  //     .find({ studentId: objectId })
  //     .lean()
  //     .exec();
  //   this.logger.debug('Enrollments found in DB for student:', enrollments);
  //   return enrollments;
  // }

  async findEnrollmentByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentDocument | null> {
    return this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .lean()
      .exec();
  }

  // async findEnrollmentsByCourse(
  //   courseId: string,
  // ): Promise<EnrollmentDocument[]> {
  //   const cacheKey = `enrollments:course:${courseId}`;
  //   const cachedEnrollments =
  //     await this.cacheManager.get<EnrollmentDocument[]>(cacheKey);
  //   if (cachedEnrollments) {
  //     this.logger.debug(
  //       'Enrollments found in cache for course:',
  //       cachedEnrollments,
  //     );
  //     return cachedEnrollments;
  //   }

  //   const objectId = new Types.ObjectId(courseId);
  //   const enrollments = await this.enrollmentModel
  //     .find({ courseId: objectId })
  //     .lean()
  //     .exec();
  //   this.logger.debug('Enrollments found in DB for course:', enrollments);
  //   if (enrollments.length > 0)
  //     await this.cacheManager.set(cacheKey, enrollments, 3600); // Кэшируем на 1 час
  //   return enrollments;
  // }

  async findEnrollmentsByCourse(courseId: string): Promise<any[]> {
    const cacheKey = `enrollments:course:${courseId}`;
    const cachedEnrollments = await this.cacheManager.get<any[]>(cacheKey);
    if (cachedEnrollments) {
      this.logger.debug(
        'Enrollments found in cache for course:',
        cachedEnrollments,
      );
      return cachedEnrollments;
    }

    const objectId = new Types.ObjectId(courseId);
    const enrollments = await this.enrollmentModel
      .find({ courseId: objectId })
      .lean()
      .exec();
    if (!enrollments.length) return [];

    const course = await this.coursesService.findCourseById(courseId);
    if (!course) throw new BadRequestException('Course not found');

    const totalLessons =
      await this.coursesService.getTotalLessonsForCourse(courseId);
    const totalModules = course.modules.length;

    const enrichedEnrollments = enrollments.map((enrollment) => ({
      studentId: enrollment.studentId.toString(),
      completedModules: enrollment.completedModules.length,
      totalModules,
      completedLessons: enrollment.completedLessons.length,
      totalLessons,
      points: enrollment.points, // Добавляем баллы
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
    this.logger.debug('Enrollments enriched for course:', enrichedEnrollments);
    return enrichedEnrollments;
  }

  async findEnrollmentById(
    enrollmentId: string,
  ): Promise<EnrollmentDocument | null> {
    const cacheKey = `enrollment:${enrollmentId}`;
    const cachedEnrollment =
      await this.cacheManager.get<EnrollmentDocument>(cacheKey);
    if (cachedEnrollment) {
      this.logger.debug('Enrollment found in cache:', cachedEnrollment);
      return cachedEnrollment;
    }

    const enrollment = await this.enrollmentModel
      .findById(enrollmentId)
      .lean()
      .exec();
    this.logger.debug('Enrollment found in DB:', enrollment);
    if (enrollment) await this.cacheManager.set(cacheKey, enrollment, 3600); // Кэшируем на 1 час
    return enrollment;
  }

  // async updateStudentProgress(
  //   studentId: string,
  //   courseId: string,
  //   moduleId: string,
  //   lessonId: string,
  // ): Promise<EnrollmentDocument | null> {
  //   const cacheKey = `enrollment:student:${studentId}:course:${courseId}`;
  //   await this.cacheManager.del(cacheKey);
  //   await this.cacheManager.del(`enrollments:student:${studentId}`);
  //   await this.cacheManager.del(`enrollments:course:${courseId}`);

  //   const enrollment = await this.enrollmentModel
  //     .findOne({
  //       studentId: new Types.ObjectId(studentId),
  //       courseId: new Types.ObjectId(courseId),
  //     })
  //     .lean()
  //     .exec();
  //   if (!enrollment) {
  //     throw new BadRequestException('Student is not enrolled in this course');
  //   }

  //   const update: any = {
  //     $addToSet: {
  //       completedLessons: new Types.ObjectId(lessonId),
  //       completedModules: new Types.ObjectId(moduleId),
  //     },
  //   };

  //   const updatedEnrollment = await this.enrollmentModel
  //     .findByIdAndUpdate(enrollment._id, update, {
  //       new: true,
  //       runValidators: true,
  //     })
  //     .lean()
  //     .exec();

  //   this.logger.debug('Updated student progress:', updatedEnrollment);

  //   await this.notificationsService.notifyProgress(
  //     enrollment._id.toString(),
  //     moduleId,
  //     lessonId,
  //   );

  //   if (updatedEnrollment?.deadline) {
  //     const daysLeft = Math.ceil(
  //       (updatedEnrollment.deadline.getTime() - new Date().getTime()) /
  //         (1000 * 60 * 60 * 24),
  //     );
  //     if (daysLeft <= 7 && daysLeft > 0) {
  //       const course = await this.coursesService.findCourseById(courseId);
  //       if (course) {
  //         await this.notificationsService.notifyDeadline(
  //           updatedEnrollment._id.toString(),
  //           daysLeft,
  //           course.title,
  //         );
  //       }
  //     }
  //   }

  //   return updatedEnrollment;
  // }

  async updateStudentProgress(
    studentId: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null> {
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
        `Enrollment not found for student ${studentId} in course ${courseId}`,
      );
      return null;
    }

    this.logger.debug(
      `Updated student progress: ${JSON.stringify(enrollment)}`,
    );
    await this.cacheManager.del(`enrollment:${enrollment._id.toString()}`);
    await this.cacheManager.del(`enrollments:student:${studentId}`);
    await this.cacheManager.del(`enrollments:course:${courseId}`);

    return enrollment;
  }

  // async completeLesson(
  //   studentId: string,
  //   courseId: string,
  //   lessonId: string,
  // ): Promise<EnrollmentDocument> {
  //   const enrollment = await this.enrollmentModel
  //     .findOne({
  //       studentId: new Types.ObjectId(studentId),
  //       courseId: new Types.ObjectId(courseId),
  //     })
  //     .exec();
  //   if (!enrollment) throw new BadRequestException('Enrollment not found');

  //   const lesson = await this.lessonModel.findById(lessonId).lean().exec();
  //   if (!lesson) throw new BadRequestException('Lesson not found');

  //   if (!enrollment.completedLessons.includes(lessonId)) {
  //     enrollment.completedLessons.push(lessonId);
  //     const pointsAwarded = lesson.points || 1;
  //     enrollment.points = (enrollment.points || 0) + pointsAwarded; // Оставляем для обратной совместимости
  //     await enrollment.save();

  //     await this.cacheManager.del(`enrollment:${enrollment._id.toString()}`);
  //     await this.cacheManager.del(`enrollments:student:${studentId}`);
  //     await this.cacheManager.del(`enrollments:course:${courseId}`);
  //     this.logger.debug(
  //       `Awarded ${pointsAwarded} points for lesson ${lessonId}`,
  //     );

  //     await this.notificationsService.notifyProgress(
  //       enrollment._id.toString(),
  //       '', // moduleId не требуется
  //       lessonId,
  //       `You earned ${pointsAwarded} points for completing lesson "${lesson.title}"!`,
  //     );
  //   }

  //   return enrollment;
  // }

  async completeLesson(
    studentId: string,
    courseId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument> {
    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .exec();
    if (!enrollment) throw new BadRequestException('Enrollment not found');

    const lesson = await this.lessonModel.findById(lessonId).lean().exec();
    if (!lesson) throw new BadRequestException('Lesson not found');

    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
      const pointsAwarded = lesson.points || 1;
      enrollment.points = (enrollment.points || 0) + pointsAwarded;
      await enrollment.save();

      await this.cacheManager.del(`enrollment:${enrollment._id.toString()}`);
      await this.cacheManager.del(`enrollments:student:${studentId}`);
      await this.cacheManager.del(`enrollments:course:${courseId}`);
      this.logger.debug(
        `Awarded ${pointsAwarded} points for lesson ${lessonId}`,
      );

      // Получаем настройки пользователя
      const student = await this.usersService.findById(studentId);
      if (!student) throw new NotFoundException('Student not found');

      await this.notificationsService.notifyProgress(
        studentId, // Используем studentId, а не enrollment._id
        `You earned ${pointsAwarded} points for completing lesson "${lesson.title}"!`,
        student.settings, // Передаём настройки уведомлений
      );
    }

    return enrollment;
  }

  // Добавляем метод awardPoints
  // async awardPoints(
  //   studentId: string,
  //   courseId: string,
  //   points: number,
  // ): Promise<EnrollmentDocument | null> {
  //   const enrollment = await this.enrollmentModel
  //     .findOne({
  //       studentId: new Types.ObjectId(studentId),
  //       courseId: new Types.ObjectId(courseId),
  //     })
  //     .exec();
  //   if (!enrollment || enrollment.isCompleted) return null;

  //   enrollment.points = (enrollment.points || 0) + points;
  //   await this.cacheManager.del(`enrollment:${enrollment._id.toString()}`);
  //   await this.cacheManager.del(`enrollments:student:${studentId}`);
  //   await this.cacheManager.del(`enrollments:course:${courseId}`);
  //   this.logger.debug(
  //     `Awarded ${points} points to enrollment ${enrollment._id}`,
  //   );
  //   return enrollment.save();
  // }

  async awardPoints(
    studentId: string,
    courseId: string,
    points: number,
  ): Promise<EnrollmentDocument> {
    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .populate('tariffId')
      .exec();
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.isCompleted)
      throw new BadRequestException('Course already completed');

    const tariff = enrollment.tariffId as TariffDocument;
    if (tariff && !tariff.includesPoints) {
      this.logger.debug(
        `Points not awarded for ${studentId} due to tariff restrictions`,
      );
      return enrollment; // Баллы не начисляются
    }

    enrollment.points = (enrollment.points || 0) + points;
    await enrollment.save();

    await this.cacheManager.del(`enrollment:${enrollment._id.toString()}`);
    await this.cacheManager.del(`enrollments:student:${studentId}`);
    await this.cacheManager.del(`enrollments:course:${courseId}`);
    this.logger.debug(
      `Awarded ${points} points to enrollment ${enrollment._id}`,
    );

    return enrollment;
  }

  // async getStudentProgress(
  //   studentId: string,
  //   courseId: string,
  // ): Promise<StudentProgress> {
  //   const cacheKey = `progress:student:${studentId}:course:${courseId}`;
  //   const cachedProgress =
  //     await this.cacheManager.get<StudentProgress>(cacheKey);
  //   if (cachedProgress) {
  //     this.logger.debug('Progress found in cache:', cachedProgress);
  //     return cachedProgress;
  //   }

  //   if (
  //     !Types.ObjectId.isValid(studentId) ||
  //     !Types.ObjectId.isValid(courseId)
  //   ) {
  //     throw new BadRequestException('Invalid studentId or courseId');
  //   }

  //   const enrollment = await this.enrollmentModel
  //     .findOne({
  //       studentId: new Types.ObjectId(studentId),
  //       courseId: new Types.ObjectId(courseId),
  //     })
  //     .lean()
  //     .exec();
  //   this.logger.debug(
  //     `Fetching progress for studentId: ${studentId}, courseId: ${courseId}`,
  //   );
  //   if (!enrollment) throw new BadRequestException('Enrollment not found');

  //   const course = await this.coursesService.findCourseById(courseId);
  //   if (!course) throw new BadRequestException('Course not found');

  //   const totalModules = course.modules.length || 0;
  //   const totalLessons =
  //     await this.coursesService.getTotalLessonsForCourse(courseId);

  //   const progress = {
  //     studentId,
  //     courseId,
  //     completedModules: enrollment.completedModules.length,
  //     totalModules,
  //     completedLessons: enrollment.completedLessons.length,
  //     totalLessons,
  //     points: enrollment.points || 0, // Добавляем баллы
  //     completionPercentage:
  //       totalLessons > 0
  //         ? Math.round(
  //             (enrollment.completedLessons.length / totalLessons) * 100,
  //           )
  //         : 0,
  //     completedModuleIds: enrollment.completedModules,
  //     completedLessonIds: enrollment.completedLessons,
  //   };

  //   await this.cacheManager.set(cacheKey, progress, 3600); // Кэшируем на 1 час
  //   this.logger.debug('Calculated student progress:', progress);
  //   return progress;
  // }

  async getStudentProgress(
    studentId: string,
    courseId: string,
  ): Promise<StudentProgress> {
    const cacheKey = `progress:student:${studentId}:course:${courseId}`;
    const cachedProgress =
      await this.cacheManager.get<StudentProgress>(cacheKey);
    if (cachedProgress) {
      this.logger.debug('Progress found in cache:', cachedProgress);
      return cachedProgress;
    }

    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Invalid studentId or courseId');
    }

    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .lean()
      .exec();
    this.logger.debug(
      `Fetching progress for studentId: ${studentId}, courseId: ${courseId}`,
    );
    if (!enrollment) throw new BadRequestException('Enrollment not found');

    const course = await this.coursesService.findCourseById(courseId);
    if (!course) throw new BadRequestException('Course not found');

    const totalModules = course.modules.length || 0;
    const totalLessons =
      await this.coursesService.getTotalLessonsForCourse(courseId);

    // Получаем отправленные домашки и квизы для подсчёта средних оценок
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

    // Рассчитываем среднюю оценку за домашки
    const avgHomeworkGrade = homeworkSubmissions.length
      ? homeworkSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) /
        homeworkSubmissions.length
      : 0;

    // Рассчитываем средний балл за квизы
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
      avgHomeworkGrade: Number(avgHomeworkGrade.toFixed(2)), // Округляем до 2 знаков
      avgQuizScore: Number(avgQuizScore.toFixed(2)), // Округляем до 2 знаков
    };

    await this.cacheManager.set(cacheKey, progress, 3600);
    this.logger.debug('Calculated student progress:', progress);
    return progress;
  }

  async getDetailedStudentProgress(
    studentId: string,
  ): Promise<DetailedStudentProgress> {
    const cacheKey = `detailed-progress:student:${studentId}`;
    const cachedProgress =
      await this.cacheManager.get<DetailedStudentProgress>(cacheKey);
    if (cachedProgress) {
      this.logger.debug(
        'Detailed student progress found in cache:',
        cachedProgress,
      );
      return cachedProgress;
    }

    const enrollments = await this.findEnrollmentsByStudent(studentId);
    const progress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.courseId.toString();
        const course = await this.coursesService.findCourseById(courseId);

        if (!course) {
          return {
            courseId,
            courseTitle: 'Course not found',
            completionPercentage: 0,
            lessonCompletionPercentage: 0,
            completedModules: 0,
            totalModules: 0,
            completedLessons: enrollment.completedLessons.length,
            totalLessons: 0,
            points: enrollment.points || 0, // Добавляем баллы
            grade: enrollment.grade,
            isCompleted: enrollment.isCompleted,
            deadline: enrollment.deadline
              ? enrollment.deadline.toISOString()
              : null,
          };
        }

        const totalModules = course?.modules.length || 0;
        const totalLessons =
          await this.coursesService.getTotalLessonsForCourse(courseId);

        return {
          courseId,
          courseTitle: course?.title || 'Unknown',
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
          points: enrollment.points || 0, // Добавляем баллы
          grade: enrollment.grade,
          isCompleted: enrollment.isCompleted,
          deadline: enrollment.deadline
            ? enrollment.deadline.toISOString()
            : null,
        };
      }),
    );

    const result = {
      studentId,
      progress,
    };
    await this.cacheManager.set(cacheKey, result, 3600); // Кэшируем детальный прогресс на 1 час
    this.logger.debug('Calculated detailed student progress:', result);
    return result;
  }

  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<EnrollmentDocument | null> {
    const enrollment = await this.findEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw new BadRequestException('Enrollment not found');
    }

    return this.updateStudentProgress(
      enrollment.studentId.toString(),
      enrollment.courseId.toString(),
      moduleId,
      lessonId,
    );
  }

  async completeCourse(
    enrollmentId: string,
    grade: number,
  ): Promise<EnrollmentDocument | null> {
    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100');
    }

    const cacheKey = `enrollment:${enrollmentId}`;
    await this.cacheManager.del(cacheKey); // Очищаем кэш для этой записи
    await this.cacheManager.del(`enrollments:student:*`);
    await this.cacheManager.del(`enrollments:course:*`);

    const enrollment = await this.enrollmentModel.findById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    enrollment.isCompleted = true;
    enrollment.grade = grade;
    const updatedEnrollment: EnrollmentDocument | null =
      await enrollment.save();

    if (!updatedEnrollment) {
      this.logger.warn('Enrollment save returned null, returning null');
      return null;
    }
    this.logger.debug('Enrollment updated successfully:', updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await this.cacheManager.del(`enrollment:${enrollmentId}`); // Очищаем кэш для этой записи
    await this.cacheManager.del(`enrollments:student:*`);
    await this.cacheManager.del(`enrollments:course:*`);
    await this.enrollmentModel.findByIdAndDelete(enrollmentId).exec();
  }

  async notifyProgress(
    enrollmentId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<void> {
    const enrollment = await this.findEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    await this.cacheManager.del(`enrollment:${enrollmentId}`); // Очищаем кэш для этой записи
    await this.cacheManager.del(
      `enrollments:student:${enrollment.studentId.toString()}`,
    );
    await this.cacheManager.del(
      `enrollments:course:${enrollment.courseId.toString()}`,
    );

    await this.notificationsService.notifyProgress(
      enrollment.studentId.toString(),
      moduleId,
      lessonId,
    );
  }

  async exportEnrollmentsToCsv(): Promise<string> {
    const cacheKey = 'enrollments:csv';
    const cachedCsv = await this.cacheManager.get<string>(cacheKey);
    if (cachedCsv) {
      this.logger.debug('CSV found in cache:', cachedCsv);
      return cachedCsv;
    }

    this.logger.debug('Exporting enrollments to CSV');
    const enrollments = (await this.enrollmentModel
      .find()
      .lean()
      .exec()) as EnrollmentDocument[];

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
          studentEmail: student?.email || 'Unknown',
          courseId: enrollment.courseId.toString(),
          courseTitle: course?.title || 'Unknown',
          completedModules: enrollment.completedModules.join(','),
          completedLessons: enrollment.completedLessons.join(','),
          points: enrollment.points || 0, // Добавляем баллы
          isCompleted: enrollment.isCompleted,
          grade: enrollment.grade || 'N/A',
          deadline: enrollment.deadline
            ? enrollment.deadline.toISOString()
            : 'N/A',
        };
      }),
    );

    const csv = stringify(csvData, { header: true });
    await this.cacheManager.set(cacheKey, csv, 3600); // Кэшируем CSV на 1 час
    return csv;
  }

  async findByCourseId(courseId: string): Promise<Enrollment[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid courseId');
    }
    return this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();
  }

  async getEnrollmentsByStudent(studentId: string) {
    return this.enrollmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .lean()
      .exec();
  }

  async getEnrollmentsByCourse(courseId: string) {
    return this.enrollmentModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();
  }

  async findOneByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<EnrollmentDocument | null> {
    return this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      })
      .populate('tariffId') // Перемещаем populate сюда
      .exec();
  }
}
