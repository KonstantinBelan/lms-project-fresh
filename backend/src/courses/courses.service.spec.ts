// src/courses/courses.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Types } from 'mongoose';
import * as fs from 'fs/promises';
import { createObjectCsvWriter } from 'csv-writer';

jest.mock('fs/promises'); // Мокаем fs/promises

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
    title: 'Test Course',
    description: 'Test Description',
    modules: [validModuleId],
  };

  const mockModuleData = {
    _id: validModuleId,
    title: 'Test Module',
    courseId: validCourseId,
    lessons: [validLessonId],
  };

  const mockLessonData = {
    _id: validLessonId,
    title: 'Test Lesson',
    moduleId: validModuleId,
    content: 'Test Content',
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

  const mockStructureData = {
    courseId: validCourseId,
    title: 'Test Course',
    modules: [
      {
        moduleId: validModuleId,
        title: 'Test Module',
        lessons: [
          {
            lessonId: validLessonId,
            title: 'Test Lesson',
            content: 'Test Content',
          },
        ],
      },
    ],
  };

  // Мок для courseModel
  const mockCourseModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: validCourseId,
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: validCourseId,
    }),
  })) as jest.Mock & {
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    db: { collection: jest.Mock };
  };

  mockCourseModel.find = jest.fn();
  mockCourseModel.findById = jest.fn();
  mockCourseModel.findByIdAndUpdate = jest.fn();
  mockCourseModel.findByIdAndDelete = jest.fn();
  mockCourseModel.db = {
    collection: jest.fn().mockReturnValue({
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockAnalyticsData]),
      }),
    }),
  };

  // Мок для moduleModel
  const mockModuleModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: validModuleId,
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: validModuleId,
    }),
  })) as jest.Mock & {
    findById: jest.Mock;
    find: jest.Mock;
  };

  mockModuleModel.findById = jest.fn();
  mockModuleModel.find = jest.fn();

  // Мок для lessonModel
  const mockLessonModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: validLessonId,
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: validLessonId,
    }),
  })) as jest.Mock & {
    countDocuments: jest.Mock;
    find: jest.Mock;
  };

  mockLessonModel.countDocuments = jest.fn();
  mockLessonModel.find = jest.fn();

  // Мок для cacheManager
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  // Мок для fs/promises
  const mockedFs = fs as jest.Mocked<typeof fs>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getModelToken('Course'), useValue: mockCourseModel },
        { provide: getModelToken('Module'), useValue: mockModuleModel },
        { provide: getModelToken('Lesson'), useValue: mockLessonModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);

    // Устанавливаем базовые значения моков
    mockCourseModel.find.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockCourseData]),
      }),
    });
    mockCourseModel.findById.mockReturnValue({
      ...mockCourseData,
      modules: [validModuleId],
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCourseData),
      }),
      save: jest.fn().mockResolvedValue({
        ...mockCourseData,
        modules: [validModuleId],
      }),
    });
    mockCourseModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        ...mockCourseData,
        title: 'Updated Course',
      }),
    });
    mockCourseModel.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: validCourseId }),
    });
    mockModuleModel.findById.mockReturnValue({
      ...mockModuleData,
      lessons: [validLessonId],
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockModuleData),
      }),
      save: jest.fn().mockResolvedValue({
        ...mockModuleData,
        lessons: [validLessonId],
      }),
    });
    mockModuleModel.find.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockModuleData]),
      }),
    });
    mockLessonModel.countDocuments.mockResolvedValue(2);
    mockLessonModel.find.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockLessonData]),
      }),
    });
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.set.mockResolvedValue(undefined);
    mockCacheManager.del.mockResolvedValue(undefined);
    mockedFs.mkdir.mockResolvedValue(undefined);
    (mockedFs.readdir as jest.Mock).mockResolvedValue(['old_file.csv']);
    mockedFs.stat.mockResolvedValue({
      mtimeMs: Date.now() - 1000 * 60 * 60 * 24 * 91,
    } as any);
    mockedFs.unlink.mockResolvedValue(undefined);
    (createObjectCsvWriter as jest.Mock).mockReturnValue({
      writeRecords: jest.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('createCourse', () => {
    it('should create a course successfully', async () => {
      const createCourseDto = {
        title: 'Test Course',
        description: 'Test Description',
      };
      const mockCourseInstance = {
        ...createCourseDto,
        _id: validCourseId,
        save: jest.fn().mockResolvedValue({
          ...createCourseDto,
          _id: validCourseId,
        }),
      };
      mockCourseModel.mockReturnValueOnce(mockCourseInstance);
      const result = await service.createCourse(createCourseDto);
      expect(mockCourseModel).toHaveBeenCalledWith(createCourseDto);
      expect(mockCourseInstance.save).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', validCourseId);
      expect(result).toHaveProperty('title', 'Test Course');
    });
  });

  describe('findAllCourses', () => {
    it('should return courses from cache if available', async () => {
      mockCacheManager.get.mockResolvedValueOnce([mockCourseData]);
      const result = await service.findAllCourses();
      expect(mockCacheManager.get).toHaveBeenCalledWith('courses:all');
      expect(mockCourseModel.find).not.toHaveBeenCalled();
      expect(result).toEqual([mockCourseData]);
    });

    it('should fetch courses from DB and cache them if not in cache', async () => {
      const result = await service.findAllCourses();
      expect(mockCacheManager.get).toHaveBeenCalledWith('courses:all');
      expect(mockCourseModel.find).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'courses:all',
        [mockCourseData],
        3600,
      );
      expect(result).toEqual([mockCourseData]);
    });
  });

  describe('findCourseById', () => {
    it('should return course from cache if available', async () => {
      mockCacheManager.get.mockResolvedValueOnce(mockCourseData);
      const result = await service.findCourseById(validCourseId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `course:${validCourseId}`,
      );
      expect(mockCourseModel.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockCourseData);
    });

    it('should fetch course from DB and cache it if not in cache', async () => {
      const result = await service.findCourseById(validCourseId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `course:${validCourseId}`,
      );
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validCourseId);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `course:${validCourseId}`,
        mockCourseData,
        3600,
      );
      expect(result).toEqual(mockCourseData);
    });

    it('should return null if course not found', async () => {
      mockCourseModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      const result = await service.findCourseById(validCourseId);
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validCourseId);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updateCourse', () => {
    it('should update course and clear cache', async () => {
      const updateCourseDto = { title: 'Updated Course' };
      const result = await service.updateCourse(validCourseId, updateCourseDto);
      expect(mockCourseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validCourseId,
        updateCourseDto,
        { new: true },
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `course:${validCourseId}`,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('courses:all');
      expect(result).toHaveProperty('title', 'Updated Course');
    });
  });

  describe('deleteCourse', () => {
    it('should delete course and clear cache', async () => {
      await service.deleteCourse(validCourseId);
      expect(mockCourseModel.findByIdAndDelete).toHaveBeenCalledWith(
        validCourseId,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `course:${validCourseId}`,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('courses:all');
    });
  });

  describe('createModule', () => {
    it('should create a module and update course', async () => {
      const createModuleDto = { title: 'Test Module' };
      const mockModuleInstance = {
        ...createModuleDto,
        _id: validModuleId,
        courseId: validCourseId,
        save: jest.fn().mockResolvedValue({
          ...createModuleDto,
          _id: validModuleId,
          courseId: validCourseId,
        }),
      };
      mockModuleModel.mockReturnValueOnce(mockModuleInstance);
      const result = await service.createModule(validCourseId, createModuleDto);
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validCourseId);
      expect(mockModuleModel).toHaveBeenCalledWith({
        ...createModuleDto,
        courseId: validCourseId,
      });
      expect(mockModuleInstance.save).toHaveBeenCalled();
      expect(mockCourseModel.findById().save).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `course:${validCourseId}`,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('courses:all');
      expect(result).toHaveProperty('_id', validModuleId);
      expect(result).toHaveProperty('title', 'Test Module');
    });

    it('should throw an error if course not found', async () => {
      mockCourseModel.findById.mockReturnValueOnce(null);
      const createModuleDto = { title: 'Test Module' };
      await expect(
        service.createModule(validCourseId, createModuleDto),
      ).rejects.toThrow('Course not found');
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validCourseId);
      expect(mockModuleModel).not.toHaveBeenCalled();
    });
  });

  describe('createLesson', () => {
    it('should create a lesson and update module', async () => {
      const createLessonDto = { title: 'Test Lesson', content: 'Test Content' };
      const mockLessonInstance = {
        ...createLessonDto,
        _id: validLessonId,
        moduleId: validModuleId,
        save: jest.fn().mockResolvedValue({
          ...createLessonDto,
          _id: validLessonId,
          moduleId: validModuleId,
        }),
      };
      mockLessonModel.mockReturnValueOnce(mockLessonInstance);
      const result = await service.createLesson(
        validCourseId,
        validModuleId,
        createLessonDto,
      );
      expect(mockModuleModel.findById).toHaveBeenCalledWith(validModuleId);
      expect(mockLessonModel).toHaveBeenCalledWith({
        ...createLessonDto,
        moduleId: validModuleId,
      });
      expect(mockLessonInstance.save).toHaveBeenCalled();
      expect(mockModuleModel.findById().save).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `module:${validModuleId}`,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `course:${validCourseId}`,
      );
      expect(result).toHaveProperty('_id', validLessonId);
      expect(result).toHaveProperty('title', 'Test Lesson');
    });

    it('should throw an error if module not found', async () => {
      mockModuleModel.findById.mockReturnValueOnce(null);
      const createLessonDto = { title: 'Test Lesson', content: 'Test Content' };
      await expect(
        service.createLesson(validCourseId, validModuleId, createLessonDto),
      ).rejects.toThrow('Module not found');
      expect(mockModuleModel.findById).toHaveBeenCalledWith(validModuleId);
      expect(mockLessonModel).not.toHaveBeenCalled();
    });
  });

  describe('getCourseAnalytics', () => {
    it('should return analytics from cache if available', async () => {
      mockCacheManager.get.mockResolvedValueOnce(mockAnalyticsData);
      const result = await service.getCourseAnalytics(validCourseId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `course:analytics:${validCourseId}`,
      );
      expect(mockCourseModel.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockAnalyticsData);
    });

    it('should calculate analytics and cache it if not in cache', async () => {
      const result = await service.getCourseAnalytics(validCourseId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `course:analytics:${validCourseId}`,
      );
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validCourseId);
      expect(mockLessonModel.countDocuments).toHaveBeenCalledWith({
        moduleId: { $in: mockCourseData.modules },
      });
      expect(mockCourseModel.db.collection).toHaveBeenCalledWith('enrollments');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `course:analytics:${validCourseId}`,
        mockAnalyticsData,
        expect.any(Number),
      );
      expect(result).toEqual(mockAnalyticsData);
    });
  });

  describe('getCourseStructure', () => {
    it('should return structure from cache if available', async () => {
      mockCacheManager.get.mockResolvedValueOnce(mockStructureData);
      const result = await service.getCourseStructure(validCourseId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `course:structure:${validCourseId}`,
      );
      expect(mockCourseModel.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockStructureData);
    });

    it('should fetch structure from DB and cache it if not in cache', async () => {
      const result = await service.getCourseStructure(validCourseId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `course:structure:${validCourseId}`,
      );
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validCourseId);
      expect(mockModuleModel.find).toHaveBeenCalledWith({
        _id: { $in: [new Types.ObjectId(validModuleId)] },
      });
      expect(mockLessonModel.find).toHaveBeenCalledWith({
        _id: { $in: [new Types.ObjectId(validLessonId)] },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `course:structure:${validCourseId}`,
        mockStructureData,
        3600,
      );
      expect(result).toEqual(mockStructureData);
    });

    it('should throw an error if course not found', async () => {
      mockCourseModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(service.getCourseStructure(validCourseId)).rejects.toThrow(
        'Course not found',
      );
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validCourseId);
      expect(mockModuleModel.find).not.toHaveBeenCalled();
    });
  });

  describe('exportCourseAnalyticsToCSV', () => {
    it('should export analytics to CSV and clean old files', async () => {
      const filePathRegex = new RegExp(
        `analytics/course_${validCourseId}/course_${validCourseId}_analytics_\\d+\.csv`,
      );
      const result = await service.exportCourseAnalyticsToCSV(validCourseId);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        `course:analytics:${validCourseId}`,
      );
      expect(mockCourseModel.findById).toHaveBeenCalledWith(validCourseId);
      expect(mockedFs.mkdir).toHaveBeenCalledWith(
        `analytics/course_${validCourseId}`,
        { recursive: true },
      );
      expect(mockedFs.readdir).toHaveBeenCalledWith(
        `analytics/course_${validCourseId}`,
      );
      expect(mockedFs.stat).toHaveBeenCalledWith(
        `analytics/course_${validCourseId}/old_file.csv`,
      );
      expect(mockedFs.unlink).toHaveBeenCalledWith(
        `analytics/course_${validCourseId}/old_file.csv`,
      );
      expect(createObjectCsvWriter).toHaveBeenCalledWith({
        path: expect.stringMatching(filePathRegex),
        header: [
          { id: 'metric', title: 'Metric' },
          { id: 'value', title: 'Value' },
        ],
      });
      expect(
        (createObjectCsvWriter as jest.Mock).mock.results[0].value.writeRecords,
      ).toHaveBeenCalled();
      expect(result).toMatch(filePathRegex);
    });
  });
});
