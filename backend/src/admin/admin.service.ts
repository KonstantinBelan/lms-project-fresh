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
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { ActivitySummaryDto } from './dto/activity-summary.dto';
import { GetActivityDto } from './dto/get-activity.dto';
import { GetCoursesDto } from './dto/get-courses.dto';
import { CourseResponseDto } from '../courses/dto/course-response.dto';
import { EnrollmentResponseDto } from '../enrollments/dto/enrollment-response.dto';
import { PaginatedCourseResponseDto } from './dto/paginated-course-response.dto';
import { PaginatedUserResponseDto } from '../users/dto/paginated-user-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { NotificationResponseDto } from '../notifications/dto/notification-response.dto';
import { PaginatedNotificationDto } from './dto/paginated-notification-response.dto';
import { PaginatedEnrollmentDto } from './dto/paginated-enrollment-response.dto';

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
  async getUsers(filters: GetUsersDto): Promise<PaginatedUserResponseDto> {
    this.logger.log(
      `Получение пользователей: страница ${filters.page}, лимит ${filters.limit}`,
    );

    const query: any = {};

    // Обработка фильтров
    if (filters.roles) {
      query.roles = {
        $in: filters.roles.split(',').map((role) => role.trim()),
      };
    }
    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }
    if (filters.groups) {
      const groupIds = filters.groups.split(',').map((id) => id.trim());
      const groupObjectIds = groupIds.map((id) => {
        if (!Types.ObjectId.isValid(id)) {
          throw new BadRequestException(`Некорректный ID группы: ${id}`);
        }
        return new Types.ObjectId(id);
      });
      query.groups = { $in: groupObjectIds };
    }

    // Пагинация
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const skip = (page - 1) * limit;

    // Выполнение запросов
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

    if (users.length <= 0) {
      throw new BadRequestException('Пользователи не найдены');
    }

    this.logger.debug(`Найдено ${users.length} пользователей из ${total}`);

    // Формирование ответа
    return {
      data: users.map((user) => new UserResponseDto(user as User)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Получение списка курсов с фильтрами и пагинацией
  async getCourses(filters): Promise<PaginatedCourseResponseDto> {
    this.logger.log(
      `Получение курсов: страница ${filters.page}, лимит ${filters.limit}`,
    );
    const query: any = {};
    if (filters.title) query.title = { $regex: filters.title, $options: 'i' };
    if (filters.description)
      query.description = { $regex: filters.description, $options: 'i' };

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 100);
    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      this.courseModel.find(query).skip(skip).limit(limit).lean().exec(),
      this.courseModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    if (courses.length <= 0) {
      throw new BadRequestException('Курсы не найдены');
    }

    this.logger.debug(`Найдено ${courses.length} курсов из ${total}`);

    return {
      data: courses.map((course) => new CourseResponseDto(course as Course)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Получение записей о зачислении с фильтрами и пагинацией
  async getEnrollments(
    filters: GetEnrollmentsDto,
  ): Promise<PaginatedEnrollmentDto> {
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
    if (filters.studentId) {
      if (!Types.ObjectId.isValid(filters.studentId)) {
        throw new BadRequestException('Некорректный ID пользователя');
      }
      query.studentId = new Types.ObjectId(filters.studentId);
    }

    // Лог для отладки запроса
    this.logger.debug(`Сформированный запрос: ${JSON.stringify(query)}`);

    const page = filters.page!; // Указываем, что page не undefined
    const limit = filters.limit!; // Указываем, что limit не undefined
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.enrollmentModel
        .find(query)
        .skip(skip)
        .limit(limit)
        // .select('studentId courseId createdAt')
        .lean()
        .exec(),
      this.enrollmentModel.countDocuments(query).exec(),
    ]);

    if (enrollments.length <= 0) {
      throw new BadRequestException('Записей о зачислениях не найдено');
    }
    this.logger.debug(
      `Найдено ${enrollments.length} записей о зачислении из ${total}`,
    );
    this.logger.debug(`Результат: ${JSON.stringify(enrollments)}`);

    return {
      data: enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Получение уведомлений с фильтрами и пагинацией
  async getNotifications(
    filters: GetNotificationsDto,
  ): Promise<PaginatedNotificationDto> {
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
        // .select('message userId courseId createdAt')
        .lean()
        .exec(),
      this.notificationModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    if (notifications.length <= 0) {
      throw new BadRequestException('Уведомлений не найдено');
    }

    this.logger.debug(
      `Найдено ${notifications.length} уведомлений из ${total}`,
    );
    return { data: notifications, total, page, limit, totalPages };
  }

  // Получение сводки по активности платформы
  async getActivity(filters: GetActivityDto): Promise<ActivitySummaryDto> {
    this.logger.log(
      `Получение сводки по активности: страница ${filters.page}, лимит ${filters.limit}`,
    );

    try {
      // Формируем фильтр по createdAt
      const dateQuery: { $gte?: Date; $lte?: Date } = {};
      if (filters.startDate) dateQuery.$gte = new Date(filters.startDate);
      if (filters.endDate) dateQuery.$lte = new Date(filters.endDate);

      // Если есть фильтры по датам, применяем их к полю createdAt
      const query = Object.keys(dateQuery).length
        ? { createdAt: dateQuery }
        : {};

      const page = filters.page ?? 1;
      const limit = Math.min(filters.limit ?? 10, 100);
      const skip = (page - 1) * limit;

      // Подсчет общего количества
      const [
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalNotifications,
        enrollmentsCount,
        notificationsCount,
      ] = await Promise.all([
        this.userModel.countDocuments(query).exec(),
        this.courseModel.countDocuments(query).exec(),
        this.enrollmentModel.countDocuments(query).exec(),
        this.notificationModel.countDocuments(query).exec(),
        this.enrollmentModel.countDocuments(query).exec(), // Общее количество записей enrollments
        this.notificationModel.countDocuments(query).exec(), // Общее количество уведомлений
      ]);

      // Получение пагинированных списков
      const [recentEnrollments, recentNotifications] = await Promise.all([
        this.enrollmentModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.notificationModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
      ]);

      this.logger.debug('recentEnrollments:', recentEnrollments);
      this.logger.debug('recentNotifications:', recentNotifications);

      this.logger.debug('recentEnrollments length:', recentEnrollments.length);
      this.logger.debug(
        'recentNotifications length:',
        recentNotifications.length,
      );

      return {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalNotifications,
        recentEnrollments: {
          data: recentEnrollments.map(
            (enrollment) => new EnrollmentResponseDto(enrollment),
          ),
          total: enrollmentsCount,
          page,
          limit,
          totalPages: Math.ceil(enrollmentsCount / limit),
        },
        recentNotifications: {
          data: recentNotifications.map(
            (notification) => new NotificationResponseDto(notification),
          ),
          total: notificationsCount,
          page,
          limit,
          totalPages: Math.ceil(notificationsCount / limit),
        },
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
