import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { Types } from 'mongoose';
import { Role } from '../auth/roles.enum';

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

  async getUsers(role?: Role): Promise<User[]> {
    this.logger.log(`Получение пользователей с ролью: ${role || 'все'}`);
    const query = role ? { roles: role } : {}; // Ищем роль в массиве roles
    return this.userModel.find(query).select('-password').lean().exec(); // Исключаем пароль
  }

  async getCourses(): Promise<Course[]> {
    this.logger.log('Получение всех курсов');
    return this.courseModel.find().select('title description').lean().exec(); // Выбираем только нужные поля
  }

  async getEnrollments(courseId?: string): Promise<Enrollment[]> {
    this.logger.log(
      `Получение записей о зачислении с courseId: ${courseId || 'все'}`,
    );
    if (courseId && !Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный ID курса');
    }
    const query = courseId ? { courseId: new Types.ObjectId(courseId) } : {};
    return this.enrollmentModel
      .find(query)
      .select('userId courseId createdAt')
      .lean()
      .exec();
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    this.logger.log(`Получение уведомлений с userId: ${userId || 'все'}`);
    if (userId && !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Некорректный ID пользователя');
    }
    const query = userId ? { userId: new Types.ObjectId(userId) } : {};
    return this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .select('message userId createdAt')
      .lean()
      .exec();
  }

  async getActivity(): Promise<any> {
    this.logger.log('Получение сводки по активности');
    try {
      const [users, courses, enrollments, notifications] = await Promise.all([
        this.userModel.countDocuments().lean().exec(),
        this.courseModel.countDocuments().lean().exec(),
        this.enrollmentModel.countDocuments().lean().exec(),
        this.notificationModel.countDocuments().lean().exec(),
      ]);

      const recentEnrollments = await this.enrollmentModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('userId courseId createdAt')
        .lean()
        .exec();

      const recentNotifications = await this.notificationModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('message userId createdAt')
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
