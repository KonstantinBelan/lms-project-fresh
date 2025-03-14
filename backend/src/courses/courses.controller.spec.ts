import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtRequest } from '../common/interfaces/jwt-request.interface';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCourse = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Тестовый курс',
    description: 'Описание',
  };
  const mockModule = {
    _id: '507f1f77bcf86cd799439012',
    title: 'Тестовый модуль',
    lessons: [],
  };
  const mockLesson = {
    _id: '507f1f77bcf86cd799439013',
    title: 'Тестовый урок',
    content: 'Содержимое',
  };

  const mockCoursesService = {
    createCourse: jest.fn().mockResolvedValue(mockCourse),
    createBatchCourses: jest.fn().mockResolvedValue([mockCourse]),
    findAllCourses: jest
      .fn()
      .mockResolvedValue({ courses: [mockCourse], total: 1 }),
    findCourseById: jest.fn().mockResolvedValue(mockCourse),
    updateCourse: jest.fn().mockResolvedValue(mockCourse),
    deleteCourse: jest.fn().mockResolvedValue(null),
    createModule: jest.fn().mockResolvedValue(mockModule),
    findModuleById: jest.fn().mockResolvedValue(mockModule),
    createLesson: jest.fn().mockResolvedValue(mockLesson),
    findLessonById: jest.fn().mockResolvedValue(mockLesson),
    getCourseStructure: jest
      .fn()
      .mockResolvedValue({ courseId: mockCourse._id, modules: [] }),
    getStudentCourseStructure: jest
      .fn()
      .mockResolvedValue({ courseId: mockCourse._id, modules: [] }),
    getCourseStatistics: jest
      .fn()
      .mockResolvedValue({ totalModules: 1, totalLessons: 2 }),
    updateLesson: jest.fn().mockResolvedValue(mockLesson),
    deleteLesson: jest.fn().mockResolvedValue(null),
    getCourseAnalytics: jest
      .fn()
      .mockResolvedValue({ totalStudents: 10, completionRate: 50 }),
    exportCourseAnalyticsToCSV: jest.fn().mockResolvedValue('path/to/file.csv'),
    getLeaderboard: jest
      .fn()
      .mockResolvedValue([
        { studentId: 'student1', name: 'Иван', points: 100 },
      ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: mockCoursesService }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('должен создать курс', async () => {
      const dto = { title: 'Тестовый курс', description: 'Описание' };
      const result = await controller.create(dto);
      expect(result).toEqual(mockCourse);
      expect(service.createCourse).toHaveBeenCalledWith(dto);
    });
  });

  describe('createBatch', () => {
    it('должен создать несколько курсов', async () => {
      const dto = {
        courses: [{ title: 'Тестовый курс', description: 'Описание' }],
      };
      const result = await controller.createBatch(dto);
      expect(result).toEqual([mockCourse]);
      expect(service.createBatchCourses).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('должен вернуть список курсов', async () => {
      const result = await controller.findAll(0, 10);
      expect(result).toEqual({ courses: [mockCourse], total: 1 });
      expect(service.findAllCourses).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('findOne', () => {
    it('должен вернуть курс по ID', async () => {
      const result = await controller.findOne(mockCourse._id);
      expect(result).toEqual(mockCourse);
      expect(service.findCourseById).toHaveBeenCalledWith(mockCourse._id);
    });

    it('должен выбросить ошибку при неверном ID', async () => {
      await expect(controller.findOne('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('courseStructure', () => {
    it('должен вернуть структуру курса', async () => {
      const result = await controller.courseStructure(mockCourse._id);
      expect(result).toEqual({ courseId: mockCourse._id, modules: [] });
      expect(service.getCourseStructure).toHaveBeenCalledWith(mockCourse._id);
    });
  });

  describe('getStudentCourseStructure', () => {
    it('должен вернуть структуру курса для студента', async () => {
      const req = { user: { sub: 'student1' } } as JwtRequest;
      const result = await controller.getStudentCourseStructure(
        mockCourse._id,
        req,
      );
      expect(result).toEqual({ courseId: mockCourse._id, modules: [] });
      expect(service.getStudentCourseStructure).toHaveBeenCalledWith(
        'student1',
        mockCourse._id,
      );
    });

    it('должен выбросить ошибку при отсутствии studentId', async () => {
      const req = { user: {} } as JwtRequest;
      await expect(
        controller.getStudentCourseStructure(mockCourse._id, req),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('update', () => {
    it('должен обновить курс', async () => {
      const dto = { title: 'Обновленный курс' };
      const result = await controller.update(mockCourse._id, dto);
      expect(result).toEqual(mockCourse);
      expect(service.updateCourse).toHaveBeenCalledWith(mockCourse._id, dto);
    });
  });

  describe('delete', () => {
    it('должен удалить курс', async () => {
      const result = await controller.delete(mockCourse._id);
      expect(result).toEqual({ message: 'Курс удален' });
      expect(service.deleteCourse).toHaveBeenCalledWith(mockCourse._id);
    });
  });

  describe('createModule', () => {
    it('должен создать модуль', async () => {
      const dto = { title: 'Тестовый модуль' };
      const result = await controller.createModule(mockCourse._id, dto);
      expect(result).toEqual(mockModule);
      expect(service.createModule).toHaveBeenCalledWith(mockCourse._id, dto);
    });
  });

  describe('findModule', () => {
    it('должен вернуть модуль', async () => {
      const result = await controller.findModule(
        mockCourse._id,
        mockModule._id,
      );
      expect(result).toEqual(mockModule);
      expect(service.findModuleById).toHaveBeenCalledWith(mockModule._id);
    });

    it('должен выбросить NotFoundException, если модуль не найден', async () => {
      mockCoursesService.findModuleById.mockResolvedValueOnce(null);
      await expect(
        controller.findModule(mockCourse._id, mockModule._id),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить BadRequestException при неверном ID', async () => {
      await expect(
        controller.findModule('invalid', mockModule._id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createLesson', () => {
    it('должен создать урок', async () => {
      const dto = { title: 'Тестовый урок', content: 'Содержимое' };
      const result = await controller.createLesson(
        mockCourse._id,
        mockModule._id,
        dto,
      );
      expect(result).toEqual(mockLesson);
      expect(service.createLesson).toHaveBeenCalledWith(
        mockCourse._id,
        mockModule._id,
        dto,
      );
    });
  });

  describe('findLesson', () => {
    it('должен вернуть урок', async () => {
      const result = await controller.findLesson(
        mockCourse._id,
        mockModule._id,
        mockLesson._id,
      );
      expect(result).toEqual(mockLesson);
      expect(service.findLessonById).toHaveBeenCalledWith(mockLesson._id);
    });

    it('должен выбросить NotFoundException, если урок не найден', async () => {
      mockCoursesService.findLessonById.mockResolvedValueOnce(null);
      await expect(
        controller.findLesson(mockCourse._id, mockModule._id, mockLesson._id),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить BadRequestException при неверном ID', async () => {
      await expect(
        controller.findLesson(mockCourse._id, mockModule._id, 'invalid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCourseStatistics', () => {
    it('должен вернуть статистику курса', async () => {
      const result = await controller.getCourseStatistics(mockCourse._id);
      expect(result).toEqual({ totalModules: 1, totalLessons: 2 });
      expect(service.getCourseStatistics).toHaveBeenCalledWith(mockCourse._id);
    });
  });

  describe('updateLesson', () => {
    it('должен обновить урок', async () => {
      const dto = { title: 'Обновленный урок', content: 'Новое содержимое' };
      const result = await controller.updateLesson(
        mockCourse._id,
        mockModule._id,
        mockLesson._id,
        dto,
      );
      expect(result).toEqual(mockLesson);
      expect(service.updateLesson).toHaveBeenCalledWith(
        mockCourse._id,
        mockModule._id,
        mockLesson._id,
        dto,
      );
    });

    it('должен выбросить NotFoundException, если урок не найден', async () => {
      mockCoursesService.updateLesson.mockResolvedValueOnce(null);
      const dto = { title: 'Обновленный урок', content: 'Новое содержимое' };
      await expect(
        controller.updateLesson(
          mockCourse._id,
          mockModule._id,
          mockLesson._id,
          dto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить BadRequestException при неверном ID', async () => {
      const dto = { title: 'Обновленный урок', content: 'Новое содержимое' };
      await expect(
        controller.updateLesson(mockCourse._id, mockModule._id, 'invalid', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteLesson', () => {
    it('должен удалить урок', async () => {
      const result = await controller.deleteLesson(
        mockCourse._id,
        mockModule._id,
        mockLesson._id,
      );
      expect(result).toEqual({ message: 'Урок удален' });
      expect(service.deleteLesson).toHaveBeenCalledWith(
        mockCourse._id,
        mockModule._id,
        mockLesson._id,
      );
    });
  });

  describe('getCourseAnalytics', () => {
    it('должен вернуть аналитику курса', async () => {
      const result = await controller.getCourseAnalytics(mockCourse._id);
      expect(result).toEqual({ totalStudents: 10, completionRate: 50 });
      expect(service.getCourseAnalytics).toHaveBeenCalledWith(mockCourse._id);
    });
  });

  describe('exportCourseAnalytics', () => {
    it('должен экспортировать аналитику в CSV', async () => {
      const res = { download: jest.fn() } as any;
      await controller.exportCourseAnalytics(mockCourse._id, res);
      expect(res.download).toHaveBeenCalledWith('path/to/file.csv');
      expect(service.exportCourseAnalyticsToCSV).toHaveBeenCalledWith(
        mockCourse._id,
      );
    });
  });

  describe('getLeaderboard', () => {
    it('должен вернуть таблицу лидеров', async () => {
      const result = await controller.getLeaderboard(mockCourse._id, 10);
      expect(result).toEqual([
        { studentId: 'student1', name: 'Иван', points: 100 },
      ]);
      expect(service.getLeaderboard).toHaveBeenCalledWith(mockCourse._id, 10);
    });
  });
});
