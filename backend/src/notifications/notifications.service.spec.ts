// src/notifications/notifications.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from '../users/users.service';
import { CoursesService } from '../courses/courses.service';
import { BadRequestException } from '@nestjs/common';
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
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const result = await service.createNotification('user1', 'Test');
      expect(mockNotificationModel.create).toHaveBeenCalledWith({
        userId: expect.any(Object),
        message: 'Test',
      });
      expect(result).toHaveProperty('_id', '1');
    });
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      await service.sendEmail('user1', 'Subject', 'Message');
      expect(mockUsersService.findById).toHaveBeenCalledWith('user1');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: 'test@example.com',
        subject: 'Subject',
        text: 'Message',
        html: '<p>Message</p>',
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(
        service.sendEmail('user1', 'Subject', 'Message'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
