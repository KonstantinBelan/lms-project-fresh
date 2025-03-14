import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { CourseAnalyticsDto } from './dto/course-analytics.dto';
import { OverallAnalyticsDto } from './dto/overall-analytics.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getCourseAnalytics: jest.fn(),
    getOverallAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('getCourseAnalytics', () => {
    it('должен возвращать аналитику курса', async () => {
      const result: CourseAnalyticsDto = {
        courseId: '507f1f77bcf86cd799439011',
        courseTitle: 'Основы программирования',
        totalStudents: 50,
        completedStudents: 45,
        completionRate: 90,
        averageGrade: 4.5,
      };
      mockAnalyticsService.getCourseAnalytics.mockResolvedValue(result);

      expect(
        await controller.getCourseAnalytics({
          courseId: '507f1f77bcf86cd799439011',
        }),
      ).toBe(result);
    });
  });

  describe('getOverallAnalytics', () => {
    it('должен возвращать общую аналитику', async () => {
      const result: OverallAnalyticsDto = {
        totalStudents: 1000,
        completedStudents: 800,
        completionRate: 80,
        averageGrade: 4.2,
        totalCourses: 50,
      };
      mockAnalyticsService.getOverallAnalytics.mockResolvedValue(result);

      expect(await controller.getOverallAnalytics()).toBe(result);
    });
  });
});
