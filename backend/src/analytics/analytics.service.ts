import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
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

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async getCourseAnalytics(courseId: string): Promise<CourseAnalyticsDto> {
    this.logger.log(`Получение аналитики для курса с ID: ${courseId}`);

    // Проверка валидности courseId
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }

    // Проверяем существование курса
    const course = await this.courseModel.findById(courseId).lean().exec();
    if (!course) {
      throw new NotFoundException(`Курс с ID ${courseId} не найден`);
    }

    // Агрегация данных по зачислениям
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
      ])
      .exec();

    const totalStudents = analytics?.totalStudents || 0;
    const completedStudents = analytics?.completedStudents || 0;
    const averageGrade = analytics?.averageGrade || 0;

    return {
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
  }

  async getOverallAnalytics(): Promise<OverallAnalyticsDto> {
    this.logger.log('Получение общей аналитики платформы');

    // Агрегация данных по всем зачислениям
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
      ])
      .exec();

    const totalCourses = await this.courseModel.countDocuments().lean().exec();

    const totalStudents = enrollmentStats?.totalStudents || 0;
    const completedStudents = enrollmentStats?.completedStudents || 0;
    const averageGrade = enrollmentStats?.averageGrade || 0;

    return {
      totalStudents,
      completedStudents,
      completionRate:
        totalStudents > 0
          ? Number(((completedStudents / totalStudents) * 100).toFixed(2))
          : 0,
      averageGrade: Number(averageGrade.toFixed(2)),
      totalCourses,
    };
  }
}
