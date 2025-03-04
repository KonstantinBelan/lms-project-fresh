import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { getModelToken } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesService } from '../courses/courses.service';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  const mockEnrollmentModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '67c59acebe3880a60e6f53b1',
        studentId: '67c4d379a5c903e26a37557c',
        courseId: '67c585ff05ac038b1bf9c1a9',
        completedModules: ['67c58261d8f478d10a0dfce0'],
        completedLessons: ['67c58285d8f478d10a0dfce5'],
        isCompleted: false,
        deadline: new Date('2025-03-15T00:00:00.000Z'),
        __v: 0,
      }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
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
        deadline: new Date('2025-03-15T00:00:00.000Z'),
        __v: 0,
      }),
    }),
  };
  const mockNotificationsService = {
    notifyProgress: jest.fn().mockResolvedValue(undefined),
    notifyDeadline: jest.fn().mockResolvedValue(undefined),
  };
  const mockCoursesService = {
    findCourseById: jest.fn().mockResolvedValue({ title: 'Test Course' }),
  };
  const mockCacheManager = {
    del: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({ ttl: 3600 })],
      providers: [
        EnrollmentsService,
        { provide: getModelToken('Enrollment'), useValue: mockEnrollmentModel },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: 'CACHE_MANAGER', useValue: mockCacheManager },
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
      studentId: expect.anything(), // Используем anything для ObjectId
      courseId: expect.anything(),
    });
    expect(mockEnrollmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '67c59acebe3880a60e6f53b1',
      {
        $addToSet: {
          completedLessons: expect.anything(),
          completedModules: expect.anything(),
        },
      },
      { new: true, runValidators: true },
    );
    expect(result.completedModules).toContain('67c5861505ac038b1bf9c1af');
    expect(result.completedLessons).toContain('67c5862905ac038b1bf9c1b5');
    expect(mockNotificationsService.notifyProgress).toHaveBeenCalledWith(
      '67c59acebe3880a60e6f53b1',
      moduleId,
      lessonId,
    );
    expect(mockCoursesService.findCourseById).toHaveBeenCalledWith(courseId);
    expect(mockNotificationsService.notifyDeadline).toHaveBeenCalled();
    expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
  });
});
