import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { getModelToken } from '@nestjs/mongoose';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  // Устанавливаем дедлайн на 7 дней от текущей даты (примерно 11 марта 2025 + 7 дней = 18 марта 2025)
  const deadlineWithin7Days = new Date();
  deadlineWithin7Days.setDate(deadlineWithin7Days.getDate() + 7);

  const mockEnrollmentModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '67c59acebe3880a60e6f53b1',
          studentId: '67c4d379a5c903e26a37557c',
          courseId: '67c585ff05ac038b1bf9c1a9',
          completedModules: ['67c58261d8f478d10a0dfce0'],
          completedLessons: ['67c58285d8f478d10a0dfce5'],
          isCompleted: false,
          deadline: deadlineWithin7Days, // Обновлённый дедлайн
          __v: 0,
        }),
      }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '67c59acebe3880a60e6f53b1',
          studentId: '67c4d379a5c903e26a37557c',
          courseId: '67c585ff05ac038b1bf9c1a9',
          completedModules: [
            '67c58261d8f478d10a0dfce0',
            '67c5861505ac038b1bf9c1af',
          ],
          completedLessons: [
            '67c58285d8f478d10a0dfce5',
            '67c5862905ac038b1bf9c1b5',
          ],
          isCompleted: false,
          deadline: deadlineWithin7Days, // Обновлённый дедлайн
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

  it('should update student progress with moduleId and lessonId', async () => {
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
    expect(mockEnrollmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '67c59acebe3880a60e6f53b1',
      {
        $addToSet: {
          completedLessons: expect.any(Types.ObjectId),
          completedModules: expect.any(Types.ObjectId),
        },
      },
      { new: true, runValidators: true },
    );
    expect(mockNotificationsService.notifyProgress).toHaveBeenCalledWith(
      '67c59acebe3880a60e6f53b1',
      moduleId,
      lessonId,
    );
    expect(mockCoursesService.findCourseById).toHaveBeenCalledWith(courseId); // Теперь должно сработать
    expect(mockNotificationsService.notifyDeadline).toHaveBeenCalledWith(
      '67c59acebe3880a60e6f53b1',
      expect.any(Number),
      'Test Course',
    );
    expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
    expect(mockCacheManager.del).toHaveBeenCalledWith(
      `enrollment:student:${studentId}:course:${courseId}`,
    );
    expect(mockCacheManager.del).toHaveBeenCalledWith(
      `enrollments:student:${studentId}`,
    );
    expect(mockCacheManager.del).toHaveBeenCalledWith(
      `enrollments:course:${courseId}`,
    );

    expect(result).not.toBeNull();
    if (result) {
      expect(result.completedModules).toContain('67c5861505ac038b1bf9c1af');
      expect(result.completedLessons).toContain('67c5862905ac038b1bf9c1b5');
    }
  });
});
