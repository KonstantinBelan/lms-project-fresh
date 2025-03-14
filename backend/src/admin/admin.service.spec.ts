import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getModelToken } from '@nestjs/mongoose';
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
import { BadRequestException } from '@nestjs/common';
import { GetCoursesDto } from './dto/get-courses.dto';
import { GetEnrollmentsDto } from './dto/get-enrollments.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { GetActivityDto } from './dto/get-activity.dto';

describe('AdminService', () => {
  let service: AdminService;
  let userModel: Model<UserDocument>;
  let courseModel: Model<CourseDocument>;
  let enrollmentModel: Model<EnrollmentDocument>;
  let notificationModel: Model<NotificationDocument>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    email: 'user@example.com',
    roles: ['STUDENT'],
  };
  const mockCourse = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Математика',
    teacherId: '507f1f77bcf86cd799439012',
  };
  const mockEnrollment = {
    userId: '507f1f77bcf86cd799439012',
    courseId: '507f1f77bcf86cd799439011',
  };
  const mockNotification = {
    message: 'Test',
    userId: '507f1f77bcf86cd799439012',
  };

  const mockModel = {
    find: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    countDocuments: jest.fn(),
    sort: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getModelToken(User.name), useValue: mockModel },
        { provide: getModelToken(Course.name), useValue: mockModel },
        { provide: getModelToken(Enrollment.name), useValue: mockModel },
        { provide: getModelToken(Notification.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    courseModel = module.get<Model<CourseDocument>>(getModelToken(Course.name));
    enrollmentModel = module.get<Model<EnrollmentDocument>>(
      getModelToken(Enrollment.name),
    );
    notificationModel = module.get<Model<NotificationDocument>>(
      getModelToken(Notification.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('должен возвращать список пользователей с пагинацией', async () => {
      const filters = { roles: ['STUDENT'] };
      mockModel.exec.mockResolvedValueOnce([mockUser]);
      mockModel.countDocuments.mockResolvedValueOnce(1);

      const result = await service.getUsers(filters, 1, 10);
      expect(result).toEqual({ users: [mockUser], total: 1 });
      expect(userModel.find).toHaveBeenCalledWith({
        roles: { $in: ['STUDENT'] },
      });
      expect(userModel.skip).toHaveBeenCalledWith(0);
      expect(userModel.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getCourses', () => {
    it('должен возвращать список курсов с пагинацией', async () => {
      const filters: GetCoursesDto = {
        title: 'Математика',
        page: 1,
        limit: 10,
      };
      mockModel.exec.mockResolvedValueOnce([mockCourse]);
      mockModel.countDocuments.mockResolvedValueOnce(1);

      const result = await service.getCourses(filters);
      expect(result).toEqual({
        data: [mockCourse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(courseModel.find).toHaveBeenCalledWith({
        title: { $regex: 'Математика', $options: 'i' },
      });
    });

    it('должен выбрасывать ошибку при некорректном teacherId', async () => {
      const filters: GetCoursesDto = { teacherId: 'invalid-id' };
      await expect(service.getCourses(filters)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getEnrollments', () => {
    it('должен возвращать список записей о зачислении', async () => {
      const filters: GetEnrollmentsDto = {
        courseId: '507f1f77bcf86cd799439011',
        page: 1,
        limit: 10,
      };
      mockModel.exec.mockResolvedValueOnce([mockEnrollment]);
      mockModel.countDocuments.mockResolvedValueOnce(1);

      const result = await service.getEnrollments(filters);
      expect(result).toEqual({ enrollments: [mockEnrollment], total: 1 });
      expect(enrollmentModel.find).toHaveBeenCalledWith({
        courseId: expect.any(Object),
      });
    });
  });

  describe('getNotifications', () => {
    it('должен возвращать список уведомлений с пагинацией', async () => {
      const filters: GetNotificationsDto = {
        userId: '507f1f77bcf86cd799439012',
        page: 1,
        limit: 10,
      };
      mockModel.exec.mockResolvedValueOnce([mockNotification]);
      mockModel.countDocuments.mockResolvedValueOnce(1);

      const result = await service.getNotifications(filters);
      expect(result).toEqual({
        data: [mockNotification],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(notificationModel.find).toHaveBeenCalledWith({
        userId: expect.any(Object),
      });
    });
  });

  describe('getActivity', () => {
    it('должен возвращать сводку по активности', async () => {
      const filters: GetActivityDto = { startDate: '2025-01-01T00:00:00Z' };
      mockModel.countDocuments.mockResolvedValueOnce(10); // users
      mockModel.countDocuments.mockResolvedValueOnce(5); // courses
      mockModel.countDocuments.mockResolvedValueOnce(20); // enrollments
      mockModel.countDocuments.mockResolvedValueOnce(30); // notifications
      mockModel.exec
        .mockResolvedValueOnce([mockEnrollment])
        .mockResolvedValueOnce([mockNotification]);

      const result = await service.getActivity(filters);
      expect(result).toEqual({
        totalUsers: 10,
        totalCourses: 5,
        totalEnrollments: 20,
        totalNotifications: 30,
        recentEnrollments: [mockEnrollment],
        recentNotifications: [mockNotification],
      });
    });

    it('должен выбрасывать ошибку при сбое запроса', async () => {
      mockModel.countDocuments.mockRejectedValueOnce(new Error('DB Error'));
      await expect(service.getActivity({})).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
