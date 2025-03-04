import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { getModelToken } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { NotificationsService } from '../notifications/notifications.service';
import { Types } from 'mongoose';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  const mockEnrollmentModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId('67c59acebe3880a60e6f53b1'),
        studentId: new Types.ObjectId('67c4d379a5c903e26a37557c'),
        courseId: new Types.ObjectId('67c585ff05ac038b1bf9c1a9'),
        completedModules: [new Types.ObjectId('67c58261d8f478d10a0dfce0')],
        completedLessons: [new Types.ObjectId('67c58285d8f478d10a0dfce5')],
        isCompleted: false,
        deadline: new Date('2025-03-15T00:00:00.000Z'),
        __v: 0,
      }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId('67c59acebe3880a60e6f53b1'),
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
        deadline: new Date('2025-03-15T00:00:00.000Z'),
        __v: 0,
      }),
    }),
  };
  const mockNotificationsService = {
    notifyProgress: jest.fn().mockResolvedValue(undefined),
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
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });
    expect(mockEnrollmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
      new Types.ObjectId('67c59acebe3880a60e6f53b1'),
      {
        $addToSet: {
          completedLessons: new Types.ObjectId(lessonId),
          completedModules: new Types.ObjectId(moduleId),
        },
      },
      { new: true, runValidators: true },
    );
    expect(result).toEqual({
      _id: expect.any(Types.ObjectId),
      studentId: expect.any(Types.ObjectId),
      courseId: expect.any(Types.ObjectId),
      completedModules: [
        new Types.ObjectId('67c58261d8f478d10a0dfce0'),
        new Types.ObjectId('67c5861505ac038b1bf9c1af'),
      ],
      completedLessons: [
        new Types.ObjectId('67c58285d8f478d10a0dfce5'),
        new Types.ObjectId('67c5862905ac038b1bf9c1b5'),
      ],
      isCompleted: false,
      deadline: expect.any(Date),
      __v: 0,
    });
    expect(mockNotificationsService.notifyProgress).toHaveBeenCalledWith(
      '67c59acebe3880a60e6f53b1',
      moduleId,
      lessonId,
    );
    expect(mockCacheManager.del).toHaveBeenCalledTimes(3); // Проверяем очистку кэша
  });
});
