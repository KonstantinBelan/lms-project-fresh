// src/enrollments/enrollments.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { getModelToken } from '@nestjs/mongoose';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  const deadlineWithin7Days = new Date();
  deadlineWithin7Days.setDate(deadlineWithin7Days.getDate() + 7);

  const mockEnrollmentModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '67c59acebe3880a60e6f53b1',
          studentId: new Types.ObjectId('67c4d379a5c903e26a37557c'),
          courseId: new Types.ObjectId('67c585ff05ac038b1bf9c1a9'),
          completedModules: [new Types.ObjectId('67c58261d8f478d10a0dfce0')],
          completedLessons: [new Types.ObjectId('67c58285d8f478d10a0dfce5')],
          isCompleted: false,
          deadline: deadlineWithin7Days,
          __v: 0,
        }),
      }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '67c59acebe3880a60e6f53b1',
          studentId: new Types.ObjectId('67c4d379a5c903e26a37557c'),
          courseId: new Types.ObjectId('67c585ff05ac038b1bf9c1a9'),
          completedModules: [
            new Types.ObjectId('67c58261d8f478d10a0dfce0'),
            new Types.ObjectId('67c5861505ac038b1bf9c1af'),
          ],
          completedLessons: [
            new Types.ObjectId('67c58285d8f478d10a0dfce5'),
            new Types.ObjectId('67c5862905ac038b1bf9c1b5'),
          ],
          isCompleted: false,
          deadline: deadlineWithin7Days,
          __v: 0,
        }),
      }),
    }),
  };

  const mockUsersService = {
    findById: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  };

  const mockCoursesService = {
    findCourseById: jest.fn().mockResolvedValue({ title: 'Test Course' }),
  };

  const mockNotificationsService = {
    notifyProgress: jest.fn().mockResolvedValue(undefined),
    notifyDeadline: jest.fn().mockResolvedValue(undefined),
  };

  const mockCacheManager = {
    del: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({ ttl: 3600 })],
      providers: [
        EnrollmentsService,
        { provide: getModelToken('Enrollment'), useValue: mockEnrollmentModel },
        { provide: UsersService, useValue: mockUsersService },
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('updateStudentProgress', () => {
    it('should update progress with new moduleId and lessonId', async () => {
      const studentId = '67c4d379a5c903e26a37557c';
      const courseId = '67c585ff05ac038b1bf9c1a9';
      const moduleId = '67c5861505ac038b1bf9c1af';
      const lessonId = '67c5862905ac038b1bf9c1b5';

      const result = await service.updateStudentProgress(
        studentId,
        courseId,
        moduleId,
        lessonId,
      );

      expect(mockEnrollmentModel.findOne).toHaveBeenCalledWith({
        studentId: expect.any(Types.ObjectId),
        courseId: expect.any(Types.ObjectId),
      });
      expect(mockEnrollmentModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result!.completedModules.map((id) => id.toString())).toEqual([
        '67c58261d8f478d10a0dfce0',
        '67c5861505ac038b1bf9c1af',
      ]);
      expect(result!.completedLessons.map((id) => id.toString())).toEqual([
        '67c58285d8f478d10a0dfce5',
        '67c5862905ac038b1bf9c1b5',
      ]);
    });

    it('should throw BadRequestException if enrollment not found', async () => {
      mockEnrollmentModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(
        service.updateStudentProgress(
          'student1',
          'course1',
          'module1',
          'lesson1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
