import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Types } from 'mongoose';
import * as fs from 'fs/promises';
import { createObjectCsvWriter } from 'csv-writer';

jest.mock('fs/promises');
jest.mock('csv-writer', () => ({
  createObjectCsvWriter: jest.fn(() => ({
    writeRecords: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('CoursesService', () => {
  let service: CoursesService;

  const validCourseId = new Types.ObjectId().toString();
  const validModuleId = new Types.ObjectId().toString();
  const validLessonId = new Types.ObjectId().toString();

  const mockCourseData = {
    _id: validCourseId,
    title: 'Тестовый курс',
    description: 'Тестовое описание',
    modules: [validModuleId],
  };

  const mockModuleData = {
    _id: validModuleId,
    title: 'Тестовый модуль',
    lessons: [validLessonId],
  };

  const mockLessonData = {
    _id: validLessonId,
    title: 'Тестовый урок',
    content: 'Тестовое содержимое',
  };

  const mockAnalyticsData = {
    totalStudents: 10,
    completedStudents: 5,
    completionRate: 50,
    averageGrade: 85,
    moduleCompletion: {
      totalModules: 1,
      completedModules: 5,
      completionRate: 50,
    },
    lessonCompletion: {
      totalLessons: 2,
      completedLessons: 10,
      completionRate: 50,
    },
  };

  const mockCourseModel = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockCourseData]),
      }),
    }),
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCourseData),
      }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCourseData),
      }),
    }),
    findByIdAndDelete: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCourseData) }),
    db: {
      collection: jest.fn().mockReturnValue({
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockAnalyticsData]),
        }),
      }),
    },
  };

  const mockModuleModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockModuleData),
      }),
    }),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockModuleData]),
      }),
    }),
    updateOne: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  };

  const mockLessonModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLessonData),
      }),
    }),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockLessonData]),
      }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLessonData),
      }),
    }),
    findByIdAndDelete: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockLessonData) }),
    countDocuments: jest.fn().mockResolvedValue(2),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getModelToken('Course'), useValue: mockCourseModel },
        { provide: getModelToken('Module'), useValue: mockModuleModel },
        { provide: getModelToken('Lesson'), useValue: mockLessonModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        {
          provide: 'UsersService',
          useValue: { findManyByIds: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: 'EnrollmentsService',
          useValue: {
            findByCourseId: jest.fn().mockResolvedValue([]),
            findOneByStudentAndCourse: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  afterEach(() => jest.clearAllMocks());

  // Проверка, что сервис определен
  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('createCourse', () => {
    // Тест успешного создания курса
    it('должен успешно создать курс', async () => {
      const createCourseDto = {
        title: 'Тестовый курс',
        description: 'Тестовое описание',
      };
      mockCourseModel.prototype.save = jest
        .fn()
        .mockResolvedValue(mockCourseData);
      const result = await service.createCourse(createCourseDto);
      expect(result).toEqual(mockCourseData);
    });

    // Тест ошибки при пустом названии
    it('должен выбросить ошибку при пустом названии', async () => {
      await expect(
        service.createCourse({ title: '', description: 'Описание' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findCourseById', () => {
    // Тест успешного поиска курса
    it('должен найти курс по ID', async () => {
      const result = await service.findCourseById(validCourseId);
      expect(result).toEqual(mockCourseData);
    });

    // Тест ошибки при некорректном ID
    it('должен выбросить ошибку при некорректном ID', async () => {
      await expect(service.findCourseById('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    // Тест получения курса из кэша
    it('должен вернуть курс из кэша, если он там есть', async () => {
      mockCacheManager.get.mockResolvedValueOnce(mockCourseData);
      const result = await service.findCourseById(validCourseId);
      expect(result).toEqual(mockCourseData);
      expect(mockCourseModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('updateLesson', () => {
    // Тест успешного обновления урока
    it('должен обновить урок', async () => {
      const updateLessonDto = {
        title: 'Обновленный урок',
        content: 'Новое содержимое',
      };
      const updatedLesson = { ...mockLessonData, ...updateLessonDto };
      mockLessonModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedLesson),
        }),
      });
      const result = await service.updateLesson(
        validCourseId,
        validModuleId,
        validLessonId,
        updateLessonDto,
      );
      expect(result).toEqual(updatedLesson);
    });

    // Тест ошибки, если урок не найден
    it('должен выбросить ошибку, если урок не найден', async () => {
      mockLessonModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });
      await expect(
        service.updateLesson(
          validCourseId,
          validModuleId,
          validLessonId,
          mockLessonData,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createModule', () => {
    it('должен успешно создать модуль', async () => {
      const createModuleDto = {
        title: 'Тестовый модуль',
        description: 'Описание',
      };
      const mockModule = {
        _id: validModuleId,
        ...createModuleDto,
        lessons: [],
      };
      mockCourseModel.findById.mockResolvedValueOnce({
        modules: [],
        save: jest.fn().mockResolvedValue({ modules: [validModuleId] }),
      });
      mockModuleModel.prototype.save = jest.fn().mockResolvedValue(mockModule);
      const result = await service.createModule(validCourseId, createModuleDto);
      expect(result).toEqual(mockModule);
    });

    it('должен выбросить ошибку, если курс не найден', async () => {
      mockCourseModel.findById.mockResolvedValueOnce(null);
      await expect(
        service.createModule(validCourseId, { title: 'Тест' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLesson', () => {
    it('должен успешно создать урок', async () => {
      const createLessonDto = { title: 'Тестовый урок', content: 'Содержимое' };
      const mockLesson = { _id: validLessonId, ...createLessonDto, points: 1 };
      mockModuleModel.findById.mockResolvedValueOnce({
        lessons: [],
        save: jest.fn().mockResolvedValue({ lessons: [validLessonId] }),
      });
      mockLessonModel.prototype.save = jest.fn().mockResolvedValue(mockLesson);
      const result = await service.createLesson(
        validCourseId,
        validModuleId,
        createLessonDto,
      );
      expect(result).toEqual(mockLesson);
    });

    it('должен выбросить ошибку, если модуль не найден', async () => {
      mockModuleModel.findById.mockResolvedValueOnce(null);
      await expect(
        service.createLesson(validCourseId, validModuleId, {
          title: 'Тест',
          content: 'Содержимое',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCourseAnalytics', () => {
    it('должен вернуть аналитику курса', async () => {
      const mockAnalytics: CourseAnalytics = {
        totalStudents: 10,
        completedStudents: 5,
        completionRate: 50,
        averageGrade: 85,
        moduleCompletion: {
          totalModules: 2,
          completedModules: 10,
          completionRate: 50,
        },
        lessonCompletion: {
          totalLessons: 4,
          completedLessons: 20,
          completionRate: 50,
        },
      };
      mockCourseModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCourseData),
        }),
      });
      mockLessonModel.countDocuments.mockResolvedValueOnce(4);
      mockCourseModel.db.collection.mockReturnValueOnce({
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockAnalytics]),
        }),
      });
      const result = await service.getCourseAnalytics(validCourseId);
      expect(result).toEqual(mockAnalytics);
    });

    it('должен вернуть пустую аналитику, если нет записей', async () => {
      mockCourseModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCourseData),
        }),
      });
      mockLessonModel.countDocuments.mockResolvedValueOnce(4);
      mockCourseModel.db.collection.mockReturnValueOnce({
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      });
      const result = await service.getCourseAnalytics(validCourseId);
      expect(result.totalStudents).toBe(0);
      expect(result.moduleCompletion.totalModules).toBe(
        mockCourseData.modules.length,
      );
    });
  });

  describe('getLeaderboard', () => {
    it('должен вернуть отсортированный лидерборд', async () => {
      const mockEnrollments = [
        { studentId: 'student1', completedLessons: ['lesson1'], points: 100 },
        {
          studentId: 'student2',
          completedLessons: ['lesson1', 'lesson2'],
          points: 200,
        },
      ];
      const mockUsers = [
        { _id: 'student1', name: 'Иван' },
        { _id: 'student2', name: 'Мария' },
      ];
      mockCourseModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCourseData),
        }),
      });
      service['enrollmentsService'].findByCourseId.mockResolvedValueOnce(
        mockEnrollments,
      );
      service['usersService'].findManyByIds.mockResolvedValueOnce(mockUsers);
      service.getTotalLessonsForCourse = jest.fn().mockResolvedValue(2);
      const result = await service.getLeaderboard(validCourseId, 2);
      expect(result).toEqual([
        {
          studentId: 'student2',
          name: 'Мария',
          completionPercentage: 100,
          points: 200,
        },
        {
          studentId: 'student1',
          name: 'Иван',
          completionPercentage: 50,
          points: 100,
        },
      ]);
    });

    it('должен вернуть пустой массив, если нет записей', async () => {
      mockCourseModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCourseData),
        }),
      });
      service['enrollmentsService'].findByCourseId.mockResolvedValueOnce([]);
      const result = await service.getLeaderboard(validCourseId);
      expect(result).toEqual([]);
    });
  });

  describe('getLessonsForCourse', () => {
    it('должен вернуть список ID уроков', async () => {
      mockCourseModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCourseData),
        }),
      });
      mockModuleModel.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue([
              { _id: validModuleId, lessons: [validLessonId] },
            ]),
        }),
      });
      const result = await service.getLessonsForCourse(validCourseId);
      expect(result).toEqual([validLessonId.toString()]);
    });

    it('должен вернуть пустой массив, если нет модулей', async () => {
      mockCourseModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockCourseData, modules: [] }),
        }),
      });
      const result = await service.getLessonsForCourse(validCourseId);
      expect(result).toEqual([]);
    });
  });
});
