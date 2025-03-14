import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema';
import {
  Homework,
  HomeworkDocument,
} from '../homeworks/schemas/homework.schema';
import {
  Submission,
  SubmissionDocument,
} from '../homeworks/schemas/submission.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

// Интерфейс для прогресса студента по курсу
interface IStudentCourseProgress {
  courseId: string;
  courseTitle: string;
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  grade?: number; // Сделано опциональным
  isCompleted: boolean;
}

// Интерфейс для результата прогресса студента
interface IStudentProgress {
  studentId: string;
  progress: IStudentCourseProgress[];
}

// Интерфейс для активности курса
interface ICourseActivity {
  courseId: string;
  totalEnrollments: number;
  activeHomeworks: number;
  totalSubmissions: number;
  recentActivity: Submission[];
}

const CACHE_TTL = parseInt(process.env.CACHE_TTL ?? '3600', 10); // 1 час

@Injectable()
export class RealTimeAnalyticsService {
  private readonly logger = new Logger(RealTimeAnalyticsService.name);

  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Homework.name) private homeworkModel: Model<HomeworkDocument>,
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.log('Инициализация сервиса аналитики в реальном времени');
  }

  // Получение прогресса студента
  async getStudentProgress(studentId: string): Promise<IStudentProgress> {
    this.logger.log(`Получение прогресса для студента: ${studentId}`);
    try {
      const objectId = this.validateObjectId(studentId, 'studentId');
      const enrollments = await this.enrollmentModel
        .find({ studentId: objectId })
        .lean()
        .exec();

      if (!enrollments.length) {
        this.logger.warn(
          `Записи о курсах для студента ${studentId} не найдены`,
        );
        return { studentId, progress: [] };
      }

      const progress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const courseId = enrollment.courseId.toString();
          const course = await this.getCourseDetails(courseId);
          return {
            courseId,
            courseTitle: course?.title || 'Неизвестно',
            completedModules: enrollment.completedModules.length,
            totalModules: course?.modules.length || 0,
            completedLessons: enrollment.completedLessons.length,
            totalLessons: await this.getTotalLessons(courseId),
            grade: enrollment.grade,
            isCompleted: enrollment.isCompleted,
          };
        }),
      );

      const result = { studentId, progress };
      this.logger.log(`Прогресс студента ${studentId} успешно получен`);
      return result;
    } catch (error) {
      this.logger.error(
        `Ошибка при получении прогресса студента ${studentId}: ${error.message}`,
      );
      throw error;
    }
  }

  // Получение активности курса
  async getCourseActivity(courseId: string): Promise<ICourseActivity> {
    this.logger.log(`Получение активности курса: ${courseId}`);
    try {
      const objectId = this.validateObjectId(courseId, 'courseId');
      const [enrollments, homeworks, submissions] = await Promise.all([
        this.enrollmentModel.find({ courseId: objectId }).lean().exec(),
        this.homeworkModel
          .find({ lessonId: { $in: await this.getLessonsForCourse(courseId) } })
          .lean()
          .exec(),
        this.submissionModel
          .find({
            homeworkId: {
              $in: (
                await this.homeworkModel
                  .find({
                    lessonId: { $in: await this.getLessonsForCourse(courseId) },
                  })
                  .lean()
                  .exec()
              ).map((h) => h._id),
            },
          })
          .lean()
          .exec(),
      ]);

      const result: ICourseActivity = {
        courseId,
        totalEnrollments: enrollments.length,
        activeHomeworks: homeworks.filter((h) => h.isActive).length,
        totalSubmissions: submissions.length,
        recentActivity: submissions
          .sort(
            (a, b) =>
              (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime(),
          )
          .slice(0, 5),
      };

      this.logger.log(`Активность курса ${courseId} успешно получена`);
      return result;
    } catch (error) {
      this.logger.error(
        `Ошибка при получении активности курса ${courseId}: ${error.message}`,
      );
      throw error;
    }
  }

  // Приватный метод для получения деталей курса с кэшированием
  private async getCourseDetails(courseId: string): Promise<any> {
    const cacheKey = `course:details:${courseId}`;
    const cachedCourse = await this.cacheManager.get<any>(cacheKey);
    if (cachedCourse) {
      this.logger.debug(`Детали курса ${courseId} найдены в кэше`);
      return cachedCourse;
    }

    this.logger.log(`Получение деталей курса: ${courseId}`);
    const course = await this.enrollmentModel.db
      .collection('courses')
      .findOne({ _id: new Types.ObjectId(courseId) });

    if (course) {
      await this.cacheManager.set(cacheKey, course, CACHE_TTL);
      this.logger.debug(`Детали курса ${courseId} сохранены в кэш`);
    }
    return course;
  }

  // Приватный метод для подсчета общего количества уроков
  private async getTotalLessons(courseId: string): Promise<number> {
    this.logger.log(`Подсчет уроков для курса: ${courseId}`);
    const course = await this.getCourseDetails(courseId);
    if (!course || !course.modules) return 0;

    const lessons = await Promise.all(
      course.modules.map((moduleId: string) =>
        this.enrollmentModel.db
          .collection('modules')
          .findOne({ _id: new Types.ObjectId(moduleId) }),
      ),
    );
    return lessons.reduce(
      (sum, lesson) => sum + (lesson?.lessons?.length || 0),
      0,
    );
  }

  // Приватный метод для получения списка уроков курса
  private async getLessonsForCourse(courseId: string): Promise<string[]> {
    this.logger.log(`Получение списка уроков для курса: ${courseId}`);
    const course = await this.getCourseDetails(courseId);
    if (!course || !course.modules) return [];

    const modules = await Promise.all(
      course.modules.map((moduleId: string) =>
        this.enrollmentModel.db
          .collection('modules')
          .findOne({ _id: new Types.ObjectId(moduleId) }),
      ),
    );
    return modules.reduce(
      (acc, module) => [...acc, ...(module?.lessons || [])],
      [],
    );
  }

  // Вспомогательный метод для валидации ObjectId
  private validateObjectId(id: string, fieldName: string): Types.ObjectId {
    try {
      return new Types.ObjectId(id);
    } catch (error) {
      this.logger.error(`Неверный формат ${fieldName}: ${id}`);
      throw new Error(`Неверный формат ${fieldName}`);
    }
  }
}
