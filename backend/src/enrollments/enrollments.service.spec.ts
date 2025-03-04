import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { getModelToken } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { NotificationsService } from '../notifications/notifications.service';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  const mockEnrollmentModel = {
    create: jest.fn().mockResolvedValue({
      studentId: '67c4d379a5c903e26a37557c',
      courseId: '67c585ff05ac038b1bf9c1a9',
      completedModules: [],
      completedLessons: [],
    }),
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        studentId: '67c4d379a5c903e26a37557c',
        courseId: '67c585ff05ac038b1bf9c1a9',
      }),
    }),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }),
  };
  const mockNotificationsService = {
    notifyProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({ ttl: 3600 })],
      providers: [
        EnrollmentsService,
        { provide: getModelToken('Enrollment'), useValue: mockEnrollmentModel },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  it('should create an enrollment', async () => {
    const enrollment = await service.createEnrollment({
      studentId: '67c4d379a5c903e26a37557c',
      courseId: '67c585ff05ac038b1bf9c1a9',
    });
    expect(enrollment.studentId).toBe('67c4d379a5c903e26a37557c');
    expect(mockEnrollmentModel.create).toHaveBeenCalled();
  });

  it('should update student progress', async () => {
    const progress = await service.updateStudentProgress(
      '67c585ff05ac038b1bf9c1a9',
      {
        completedModules: ['module1'],
        completedLessons: ['lesson1'],
      },
    );
    expect(mockEnrollmentModel.findOne).toHaveBeenCalledWith({
      _id: '67c585ff05ac038b1bf9c1a9',
    });
    expect(mockNotificationsService.notifyProgress).toHaveBeenCalled();
  });

  it('should get student progress', async () => {
    const progress = await service.getStudentProgress(
      '67c4d379a5c903e26a37557c',
      '67c585ff05ac038b1bf9c1a9',
    );
    expect(progress).toBeDefined();
    expect(mockEnrollmentModel.findOne).toHaveBeenCalled();
  });
});
