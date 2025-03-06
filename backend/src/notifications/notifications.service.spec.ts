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

  const mockNotificationModel = {
    create: jest
      .fn()
      .mockResolvedValue({ _id: '1', userId: 'user1', message: 'Test' }),
  };

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

  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  };

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
  });

  afterEach(() => jest.clearAllMocks());

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const result = await service.createNotification('user1', 'Test');
      expect(mockNotificationModel.create).toHaveBeenCalledWith({
        userId: 'user1',
        message: 'Test',
      });
      expect(result).toHaveProperty('_id', '1');
    });
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      await service.sendEmail('user1', 'Subject', 'Message');
      expect(mockUsersService.findById).toHaveBeenCalledWith('user1');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });
});
