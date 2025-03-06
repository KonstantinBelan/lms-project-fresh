// src/courses/courses.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Types } from 'mongoose';

// Интерфейс для типизации моков Mongoose
interface MockModel {
  new (data: any): {
    save: jest.Mock;
    [key: string]: any;
  };
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
}

describe('CoursesService', () => {
  let service: CoursesService;

  const validCourseId = new Types.ObjectId().toString();

  const mockCourseData = {
    _id: validCourseId,
    title: 'Test Course',
    description: 'Test Description',
    modules: [],
  };

  // Мок для courseModel как Jest-функция
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
  };

  mockCourseModel.find = jest.fn();
  mockCourseModel.findById = jest.fn();
  mockCourseModel.findByIdAndUpdate = jest.fn();
  mockCourseModel.findByIdAndDelete = jest.fn();

  // Пустые моки для moduleModel и lessonModel (пока не используются)
  const mockModuleModel = {};
  const mockLessonModel = {};

  // Мок для cacheManager
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

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
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCourseData),
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
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.set.mockResolvedValue(undefined);
    mockCacheManager.del.mockResolvedValue(undefined);
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
});
