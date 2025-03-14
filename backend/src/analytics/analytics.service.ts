import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { CourseAnalyticsDto } from './dto/course-analytics.dto';
import { OverallAnalyticsDto } from './dto/overall-analytics.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// Интерфейсы
interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  completedStudents: number;
  completionRate: number;
  averageGrade: number;
}

interface OverallAnalytics {
  totalStudents: number;
  completedStudents: number;
  completionRate: number;
  averageGrade: number;
  totalCourses: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getCourseAnalytics(courseId: string): Promise<CourseAnalyticsDto> {
    this.logger.log(`Получение аналитики для курса с ID: ${courseId}`);
    const cacheKey = `course_analytics_${courseId}`;
    const cachedAnalytics =
      await this.cacheManager.get<CourseAnalytics>(cacheKey);
    if (cachedAnalytics) {
      this.logger.debug(`Аналитика для курса ${courseId} найдена в кэше`);
      return cachedAnalytics;
    }

    if (!Types.ObjectId.isValid(courseId)) {
      this.logger.warn(`Некорректный ID курса: ${courseId}`);
      throw new BadRequestException('Некорректный ID курса');
    }

    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) {
      this.logger.warn(`Курс с ID ${courseId} не найден`);
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

    const [analytics] = await this.enrollmentModel
      .aggregate([
        { $match: { courseId: new Types.ObjectId(courseId) } },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            completedStudents: { $sum: { $cond: ['$isCompleted', 1, 0] } },
            averageGrade: { $avg: '$grade' },
          },
        },
        {
          $project: {
            _id: 0,
            totalStudents: 1,
            completedStudents: 1,
            averageGrade: 1,
          },
        },
      ])
      .exec();

    const totalStudents = analytics?.totalStudents || 0;
    const completedStudents = analytics?.completedStudents || 0;
    const averageGrade = analytics?.averageGrade || 0;

    const result: CourseAnalytics = {
      courseId,
      courseTitle: course.title || 'Неизвестно',
      totalStudents,
      completedStudents,
      completionRate:
        totalStudents > 0
          ? Number(((completedStudents / totalStudents) * 100).toFixed(2))
          : 0,
      averageGrade: Number(averageGrade.toFixed(2)),
    };

    await this.cacheManager.set(cacheKey, result, 3600); // Кэшируем на 1 час
    this.logger.log(`Аналитика для курса ${courseId} успешно получена`);
    return result;
  }

  async getOverallAnalytics(): Promise<OverallAnalyticsDto> {
    this.logger.log('Получение общей аналитики платформы');
    const cacheKey = 'overall_analytics';
    const cachedAnalytics =
      await this.cacheManager.get<OverallAnalytics>(cacheKey);
    if (cachedAnalytics) {
      this.logger.debug('Общая аналитика найдена в кэше');
      return cachedAnalytics;
    }

    const [enrollmentStats] = await this.enrollmentModel
      .aggregate([
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            completedStudents: { $sum: { $cond: ['$isCompleted', 1, 0] } },
            averageGrade: { $avg: '$grade' },
          },
        },
        {
          $project: {
            _id: 0,
            totalStudents: 1,
            completedStudents: 1,
            averageGrade: 1,
          },
        },
      ])
      .exec();

    const totalCourses = await this.courseModel.countDocuments().lean().exec();

    const totalStudents = enrollmentStats?.totalStudents || 0;
    const completedStudents = enrollmentStats?.completedStudents || 0;
    const averageGrade = enrollmentStats?.averageGrade || 0;

    const result: OverallAnalytics = {
      totalStudents,
      completedStudents,
      completionRate:
        totalStudents > 0
          ? Number(((completedStudents / totalStudents) * 100).toFixed(2))
          : 0,
      averageGrade: Number(averageGrade.toFixed(2)),
      totalCourses,
    };

    await this.cacheManager.set(cacheKey, result, 3600); // Кэшируем на 1 час
    this.logger.log('Общая аналитика успешно получена');
    return result;
  }
}
