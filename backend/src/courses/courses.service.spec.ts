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

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('createCourse', () => {
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

    it('должен выбросить ошибку при пустом названии', async () => {
      await expect(
        service.createCourse({ title: '', description: 'Описание' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findCourseById', () => {
    it('должен найти курс по ID', async () => {
      const result = await service.findCourseById(validCourseId);
      expect(result).toEqual(mockCourseData);
    });

    it('должен выбросить ошибку при некорректном ID', async () => {
      await expect(service.findCourseById('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateLesson', () => {
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
});
