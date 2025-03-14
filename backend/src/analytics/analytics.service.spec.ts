import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { CourseAnalyticsDto } from './dto/course-analytics.dto';
import { OverallAnalyticsDto } from './dto/overall-analytics.dto';
import { Model } from 'mongoose';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let enrollmentModel: Model<any>;
  let courseModel: Model<any>;

  const mockEnrollmentModel = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };
  const mockCourseModel = {
    findById: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken('Enrollment'), useValue: mockEnrollmentModel },
        { provide: getModelToken('Course'), useValue: mockCourseModel },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    enrollmentModel = module.get(getModelToken('Enrollment'));
    courseModel = module.get(getModelToken('Course'));
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('getCourseAnalytics', () => {
    it('должен возвращать аналитику курса', async () => {
      mockCourseModel.findById.mockResolvedValue({
        title: 'Основы программирования',
      });
      mockEnrollmentModel.aggregate.mockResolvedValue([
        { totalStudents: 50, completedStudents: 45, averageGrade: 4.5 },
      ]);

      const result = await service.getCourseAnalytics(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual({
        courseId: '507f1f77bcf86cd799439011',
        courseTitle: 'Основы программирования',
        totalStudents: 50,
        completedStudents: 45,
        completionRate: 90,
        averageGrade: 4.5,
      });
    });

    it('должен выбрасывать исключение при некорректном ID', async () => {
      await expect(service.getCourseAnalytics('invalid-id')).rejects.toThrow(
        'Некорректный ID курса',
      );
    });
  });

  describe('getOverallAnalytics', () => {
    it('должен возвращать общую аналитику', async () => {
      mockEnrollmentModel.aggregate.mockResolvedValue([
        { totalStudents: 1000, completedStudents: 800, averageGrade: 4.2 },
      ]);
      mockCourseModel.countDocuments.mockResolvedValue(50);

      const result = await service.getOverallAnalytics();
      expect(result).toEqual({
        totalStudents: 1000,
        completedStudents: 800,
        completionRate: 80,
        averageGrade: 4.2,
        totalCourses: 50,
      });
    });
  });
});
