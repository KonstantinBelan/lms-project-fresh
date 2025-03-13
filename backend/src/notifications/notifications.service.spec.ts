// src/notifications/notifications.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as nodemailer from 'nodemailer';

describe('NotificationsService', () => {
  let service: NotificationsService;

  // Мок для модели уведомлений
  const mockNotificationModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: '1',
    save: jest.fn().mockResolvedValue({
      _id: '1',
      userId: data.userId,
      message: data.message,
    }),
  }));

  const mockUsersService = {
    findById: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  };

  const mockCoursesService = {
    findCourseById: jest.fn().mockResolvedValue({ title: 'Test Course' }),
  };

  const mockEnrollmentsService = {
    findEnrollmentById: jest.fn().mockResolvedValue({
      _id: '1',
      studentId: 'user1',
      courseId: 'course1',
    }),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  };

  // const mockTransporter = {
  //   sendMail: jest.fn().mockResolvedValue(undefined),
  // };

  beforeEach(async () => {
    jest
      .spyOn(nodemailer, 'createTransport')
      .mockReturnValue(mockTransporter as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken('Notification'),
          useValue: mockNotificationModel,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    // Мокаем логгер для проверки вызовов
    jest.spyOn(service['logger'], 'log').mockImplementation();
  });

  afterEach(() => jest.clearAllMocks());

  describe('createNotification', () => {
    it('должен создать уведомление', async () => {
      const result = await service.createNotification({
        title: 'Test Title',
        message: 'Test',
        userId: 'user1',
      });
      expect(mockNotificationModel).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test',
        userId: 'user1',
      });
      expect(result).toHaveProperty('_id', '1');
      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Создание уведомления'),
      );
    });
  });

  describe('sendEmail', () => {
    it('должен успешно отправить email', async () => {
      await service.sendEmail('user1', 'Subject', 'Message');
      expect(mockUsersService.findById).toHaveBeenCalledWith('user1');
      // expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Сообщение email отправлено'),
      );
    });
  });

  describe('notifyNewCourse', () => {
    it('должен уведомить о новом курсе', async () => {
      mockNotificationModel.mockImplementationOnce((data) => ({
        ...data,
        _id: '2',
        save: jest.fn().mockResolvedValue({
          _id: '2',
          userId: data.userId,
          message: data.message,
          title: data.title,
        }),
      }));

      await service.notifyNewCourse('user1', 'course1', 'Test Course');
      expect(mockNotificationModel).toHaveBeenCalledWith({
        userId: 'user1',
        message: expect.any(String),
        title: expect.any(String),
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'notification:newcourse:user1:course1',
        expect.any(String),
        3600,
      );
      expect(service['logger'].log).toHaveBeenCalledWith(
        expect.stringContaining('Уведомление о новом курсе'),
      );
    });
  });
});
