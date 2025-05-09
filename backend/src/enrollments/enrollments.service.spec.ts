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

  const validStudentId = new Types.ObjectId().toString();
  const validCourseId = new Types.ObjectId().toString();
  const validModuleId = new Types.ObjectId().toString();
  const validLessonId = new Types.ObjectId().toString();

  const mockEnrollmentModel = {
    findOne: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '67c59acebe3880a60e6f53b1',
          studentId: new Types.ObjectId(validStudentId),
          courseId: new Types.ObjectId(validCourseId),
          completedModules: [new Types.ObjectId('67c58261d8f478d10a0dfce0')],
          completedLessons: [new Types.ObjectId('67c58285d8f478d10a0dfce5')],
          isCompleted: false,
          deadline: new Date(),
        }),
      }),
    })),
    findByIdAndUpdate: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '67c59acebe3880a60e6f53b1',
          studentId: new Types.ObjectId(validStudentId),
          courseId: new Types.ObjectId(validCourseId),
          completedModules: [
            new Types.ObjectId('67c58261d8f478d10a0dfce0'),
            new Types.ObjectId(validModuleId),
          ],
          completedLessons: [
            new Types.ObjectId('67c58285d8f478d10a0dfce5'),
            new Types.ObjectId(validLessonId),
          ],
          isCompleted: false,
          deadline: new Date(),
        }),
      }),
    })),
  };

  const mockUsersService = {
    findById: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
  };

  const mockCoursesService = {
    findCourseById: jest.fn().mockResolvedValue({ title: 'Тестовый курс' }),
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

  const mockQueue = {
    add: jest.fn().mockResolvedValue(undefined),
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
        { provide: 'BullQueue_notifications', useValue: mockQueue },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('updateStudentProgress', () => {
    it('должен обновить прогресс с новым moduleId и lessonId', async () => {
      const result = await service.updateStudentProgress(
        validStudentId,
        validCourseId,
        validModuleId,
        validLessonId,
      );

      expect(mockEnrollmentModel.findOne).toHaveBeenCalled();
      expect(mockEnrollmentModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result!.completedModules.map((id) => id.toString())).toContain(
        validModuleId,
      );
    });

    it('должен выбросить BadRequestException, если зачисление не найдено', async () => {
      mockEnrollmentModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }));
      await expect(
        service.updateStudentProgress(
          new Types.ObjectId().toString(),
          new Types.ObjectId().toString(),
          validModuleId,
          validLessonId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    // Новый тест: проверка на некорректный MongoID
    it('должен выбросить ошибку при некорректном studentId', async () => {
      await expect(
        service.updateStudentProgress(
          'invalid-id',
          validCourseId,
          validModuleId,
          validLessonId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // Новый блок тестов для метода createEnrollment
  describe('createEnrollment', () => {
    it('должен создать новое зачисление', async () => {
      mockEnrollmentModel.findOne.mockImplementation(() => ({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }));
      const mockEnrollment = {
        _id: '67c59acebe3880a60e6f53b1',
        studentId: validStudentId,
        courseId: validCourseId,
        save: jest.fn().mockResolvedValue(true),
      };
      jest
        .spyOn(service['enrollmentModel'], 'create')
        .mockResolvedValue(mockEnrollment as any);

      const result = await service.createEnrollment(
        validStudentId,
        validCourseId,
      );
      expect(result).toBeDefined();
      expect(result._id).toBe('67c59acebe3880a60e6f53b1');
    });
  });
});
