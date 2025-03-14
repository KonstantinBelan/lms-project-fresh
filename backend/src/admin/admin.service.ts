import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enrollments/schemas/enrollment.schema';
import {
  Notification,
  NotificationDocument,
} from '../notifications/schemas/notification.schema';
import { GetEnrollmentsDto } from './dto/get-enrollments.dto';
import {
  GetNotificationsDto,
  INotificationResponse,
} from './dto/get-notifications.dto';
import { GetActivityDto, IActivityResponse } from './dto/get-activity.dto';
import { GetCoursesDto, ICourseResponse } from './dto/get-courses.dto';

// Интерфейс для ответа метода getUsers
interface IUserResponse {
  users: User[];
  total: number;
}

// Интерфейс для ответа метода getEnrollments
interface IEnrollmentResponse {
  enrollments: Enrollment[];
  total: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // Получение списка пользователей с фильтрами и пагинацией
  async getUsers(
    filters: { roles?: string[]; email?: string; groups?: string[] } = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<IUserResponse> {
    this.logger.log(
      `Получение пользователей: страница ${page}, лимит ${limit}`,
    );
    const query: any = {};
    if (filters.roles?.length) query.roles = { $in: filters.roles };
    if (filters.email) query.email = { $regex: filters.email, $options: 'i' };
    if (filters.groups?.length) {
      const groupObjectIds = filters.groups.map((id) => {
        if (!Types.ObjectId.isValid(id)) {
          throw new BadRequestException(`Некорректный ID группы: ${id}`);
        }
        return new Types.ObjectId(id);
      });
      query.groups = { $in: groupObjectIds };
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean()
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    this.logger.debug(`Найдено ${users.length} пользователей из ${total}`);
    return { users, total };
  }

  // Получение списка курсов с фильтрами и пагинацией
  async getCourses(filters: GetCoursesDto = {}): Promise<ICourseResponse> {
    this.logger.log(
      `Получение курсов: страница ${filters.page}, лимит ${filters.limit}`,
    );
    const query: any = {};
    if (filters.title) query.title = { $regex: filters.title, $options: 'i' };
    if (filters.teacherId) {
      if (!Types.ObjectId.isValid(filters.teacherId)) {
        throw new BadRequestException('Некорректный ID преподавателя');
      }
      query.teacherId = new Types.ObjectId(filters.teacherId);
    }

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 100);
    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      this.courseModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .select('title description teacherId')
        .lean()
        .exec(),
      this.courseModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    this.logger.debug(`Найдено ${courses.length} курсов из ${total}`);
    return { data: courses, total, page, limit, totalPages };
  }

  // Получение записей о зачислении с фильтрами и пагинацией
  async getEnrollments(
    filters: GetEnrollmentsDto,
  ): Promise<IEnrollmentResponse> {
    this.logger.log(
      `Получение записей о зачислении: страница ${filters.page}, лимит ${filters.limit}`,
    );
    const query: any = {};
    if (filters.courseId) {
      if (!Types.ObjectId.isValid(filters.courseId)) {
        throw new BadRequestException('Некорректный ID курса');
      }
      query.courseId = new Types.ObjectId(filters.courseId);
    }
    if (filters.userId) {
      if (!Types.ObjectId.isValid(filters.userId)) {
        throw new BadRequestException('Некорректный ID пользователя');
      }
      query.userId = new Types.ObjectId(filters.userId);
    }

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 100);
    const skip = (page - 1) * limit;
    const [enrollments, total] = await Promise.all([
      this.enrollmentModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .select('userId courseId createdAt')
        .lean()
        .exec(),
      this.enrollmentModel.countDocuments(query).exec(),
    ]);

    this.logger.debug(
      `Найдено ${enrollments.length} записей о зачислении из ${total}`,
    );
    return { enrollments, total };
  }

  // Получение уведомлений с фильтрами и пагинацией
  async getNotifications(
    filters: GetNotificationsDto,
  ): Promise<INotificationResponse> {
    this.logger.log(
      `Получение уведомлений: страница ${filters.page}, лимит ${filters.limit}`,
    );
    const query: any = {};
    if (filters.userId) {
      if (!Types.ObjectId.isValid(filters.userId)) {
        throw new BadRequestException('Некорректный ID пользователя');
      }
      query.userId = new Types.ObjectId(filters.userId);
    }
    if (filters.courseId) {
      if (!Types.ObjectId.isValid(filters.courseId)) {
        throw new BadRequestException('Некорректный ID курса');
      }
      query.courseId = new Types.ObjectId(filters.courseId);
    }

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 100);
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('message userId courseId createdAt')
        .lean()
        .exec(),
      this.notificationModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);
    this.logger.debug(
      `Найдено ${notifications.length} уведомлений из ${total}`,
    );
    return { data: notifications, total, page, limit, totalPages };
  }

  // Получение сводки по активности платформы
  async getActivity(filters: GetActivityDto): Promise<IActivityResponse> {
    this.logger.log('Получение сводки по активности');
    try {
      const dateQuery: any = {};
      if (filters.startDate) dateQuery.$gte = new Date(filters.startDate);
      if (filters.endDate) dateQuery.$lte = new Date(filters.endDate);

      const [users, courses, enrollments, notifications] = await Promise.all([
        this.userModel
          .countDocuments(dateQuery.createdAt ? { createdAt: dateQuery } : {})
          .lean()
          .exec(),
        this.courseModel
          .countDocuments(dateQuery.createdAt ? { createdAt: dateQuery } : {})
          .lean()
          .exec(),
        this.enrollmentModel
          .countDocuments(dateQuery.createdAt ? { createdAt: dateQuery } : {})
          .lean()
          .exec(),
        this.notificationModel
          .countDocuments(dateQuery.createdAt ? { createdAt: dateQuery } : {})
          .lean()
          .exec(),
      ]);

      const recentEnrollments = await this.enrollmentModel
        .find(dateQuery.createdAt ? { createdAt: dateQuery } : {})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('userId courseId createdAt')
        .lean()
        .exec();

      const recentNotifications = await this.notificationModel
        .find(dateQuery.createdAt ? { createdAt: dateQuery } : {})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('message userId courseId createdAt')
        .lean()
        .exec();

      return {
        totalUsers: users,
        totalCourses: courses,
        totalEnrollments: enrollments,
        totalNotifications: notifications,
        recentEnrollments,
        recentNotifications,
      };
    } catch (error) {
      this.logger.error(
        'Ошибка при получении сводки по активности',
        error.stack,
      );
      throw new BadRequestException('Не удалось получить сводку по активности');
    }
  }
}
