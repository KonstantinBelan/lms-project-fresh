import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeAnalyticsService } from './real-time-analytics.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Types } from 'mongoose';

describe('RealTimeAnalyticsService', () => {
  let service: RealTimeAnalyticsService;

  const mockEnrollmentModel = {
    find: jest.fn(),
    db: { collection: jest.fn() },
  };
  const mockHomeworkModel = { find: jest.fn() };
  const mockSubmissionModel = { find: jest.fn() };
  const mockCacheManager = { get: jest.fn(), set: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealTimeAnalyticsService,
        { provide: getModelToken('Enrollment'), useValue: mockEnrollmentModel },
        { provide: getModelToken('Homework'), useValue: mockHomeworkModel },
        { provide: getModelToken('Submission'), useValue: mockSubmissionModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<RealTimeAnalyticsService>(RealTimeAnalyticsService);

    mockEnrollmentModel.find.mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    });
    mockHomeworkModel.find.mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    });
    mockSubmissionModel.find.mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    });
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.set.mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());

  it('должен вернуть пустой прогресс для студента без записей', async () => {
    const studentId = new Types.ObjectId().toString();
    const result = await service.getStudentProgress(studentId);
    expect(result).toEqual({ studentId, progress: [] });
  });

  it('должен вернуть активность курса', async () => {
    const courseId = new Types.ObjectId().toString();
    const result = await service.getCourseActivity(courseId);
    expect(result).toHaveProperty('courseId', courseId);
    expect(result).toHaveProperty('totalEnrollments', 0);
  });
});
