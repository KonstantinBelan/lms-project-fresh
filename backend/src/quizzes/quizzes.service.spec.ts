// src/quizzes/quizzes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

// Интерфейс для явной типизации моков
interface MockModel {
  new (data: any): {
    save: jest.Mock;
    toObject: jest.Mock;
    [key: string]: any;
  };
  findById: jest.Mock;
  findOne: jest.Mock; // Делаем обязательным
  findByIdAndUpdate: jest.Mock;
  deleteOne: jest.Mock;
}

describe('QuizzesService', () => {
  let service: QuizzesService;

  const validQuizId = new Types.ObjectId().toString();
  const validLessonId = new Types.ObjectId().toString();
  const validStudentId = new Types.ObjectId().toString();
  const validModuleId = new Types.ObjectId().toString();
  const validCourseId = new Types.ObjectId().toString();

  const mockQuizData = {
    _id: validQuizId,
    lessonId: validLessonId,
    title: 'Test Quiz',
    questions: [
      { question: 'Q1', correctAnswers: [0], weight: 1, hint: 'Hint 1' },
      { question: 'Q2', correctAnswers: [1], weight: 2 },
    ],
  };

  const mockLessonData = {
    _id: validLessonId,
    title: 'Test Lesson',
    moduleId: validModuleId,
  };

  const mockModuleData = {
    _id: validModuleId,
    title: 'Test Module',
    lessons: [validLessonId],
  };

  const mockCourseData = {
    _id: validCourseId,
    title: 'Test Course',
    modules: [validModuleId],
  };

  // Мок для quizModel как функция-конструктор
  const mockQuizModel: MockModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: validQuizId,
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: validQuizId,
      toObject: jest.fn().mockReturnValue({
        ...data,
        _id: validQuizId,
      }),
    }),
  })) as any;

  mockQuizModel.findById = jest.fn();
  mockQuizModel.findByIdAndUpdate = jest.fn();
  mockQuizModel.deleteOne = jest.fn();

  // Мок для quizSubmissionModel как функция-конструктор
  const mockQuizSubmissionModel: MockModel = jest
    .fn()
    .mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        ...data,
        toObject: jest.fn().mockReturnValue(data),
      }),
    })) as any;

  mockQuizSubmissionModel.findOne = jest.fn();

  // Мок для lessonModel
  const mockLessonModel = {
    findById: jest.fn(),
  };

  // Мок для moduleModel
  const mockModuleModel = {
    findOne: jest.fn(),
  };

  // Мок для courseModel
  const mockCourseModel = {
    findOne: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockEnrollmentsService = {
    updateStudentProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: getModelToken('Quiz'), useValue: mockQuizModel },
        {
          provide: getModelToken('QuizSubmission'),
          useValue: mockQuizSubmissionModel,
        },
        { provide: getModelToken('Lesson'), useValue: mockLessonModel },
        { provide: getModelToken('Module'), useValue: mockModuleModel },
        { provide: getModelToken('Course'), useValue: mockCourseModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);

    // Устанавливаем базовые значения моков
    mockQuizModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuizData),
      }),
    });
    mockQuizModel.findByIdAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockQuizData,
          title: 'Updated Quiz',
        }),
      }),
    });
    mockQuizModel.deleteOne.mockResolvedValue({ deletedCount: 1 });
    mockQuizSubmissionModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });
    mockLessonModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLessonData),
      }),
    });
    mockModuleModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockModuleData),
      }),
    });
    mockCourseModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCourseData),
      }),
    });
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.set.mockResolvedValue(undefined);
    mockCacheManager.del.mockResolvedValue(undefined);
    mockEnrollmentsService.updateStudentProgress.mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createQuiz', () => {
    it('should create a quiz successfully', async () => {
      const result = await service.createQuiz(validLessonId, 'Test Quiz', [
        { question: 'Q1', correctAnswers: [0], weight: 1, hint: 'Hint 1' },
      ]);
      expect(mockQuizModel).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', validQuizId);
    });
  });

  describe('submitQuiz', () => {
    it('should submit quiz and calculate score', async () => {
      const result = await service.submitQuiz(validStudentId, validQuizId, [
        [0],
        [1],
      ]);
      expect(mockQuizModel.findById).toHaveBeenCalledWith(validQuizId);
      expect(mockQuizSubmissionModel).toHaveBeenCalled();
      expect(mockLessonModel.findById).toHaveBeenCalledWith(validLessonId);
      expect(mockModuleModel.findOne).toHaveBeenCalledWith({
        lessons: validLessonId,
      });
      expect(mockCourseModel.findOne).toHaveBeenCalledWith({
        modules: validModuleId,
      });
      expect(result).toHaveProperty('score', 100);
    });

    it('should throw BadRequestException if quiz not found', async () => {
      mockQuizModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(
        service.submitQuiz(validStudentId, validQuizId, [[0]]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getQuizHints', () => {
    it('should return hints for quiz questions', async () => {
      const result = await service.getQuizHints(validQuizId);
      expect(mockQuizModel.findById).toHaveBeenCalledWith(validQuizId);
      expect(result).toEqual([
        { question: 'Q1', hint: 'Hint 1' },
        { question: 'Q2', hint: undefined },
      ]);
    });

    it('should throw BadRequestException if quiz not found', async () => {
      mockQuizModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(service.getQuizHints(validQuizId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz and clear cache', async () => {
      const updateData = { title: 'Updated Quiz' };
      const result = await service.updateQuiz(validQuizId, updateData);
      expect(mockQuizModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validQuizId,
        updateData,
        { new: true },
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(`quiz:${validQuizId}`);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `quizzes:lesson:${validLessonId}`,
      );
      expect(result).toHaveProperty('title', 'Updated Quiz');
    });

    it('should return null if quiz not found', async () => {
      mockQuizModel.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      const result = await service.updateQuiz(validQuizId, {
        title: 'Updated Quiz',
      });
      expect(mockQuizModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockCacheManager.del).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz and clear cache', async () => {
      await service.deleteQuiz(validQuizId);
      expect(mockQuizModel.findById).toHaveBeenCalledWith(validQuizId);
      expect(mockQuizModel.deleteOne).toHaveBeenCalledWith({
        _id: validQuizId,
      });
      expect(mockCacheManager.del).toHaveBeenCalledWith(`quiz:${validQuizId}`);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `quizzes:lesson:${validLessonId}`,
      );
    });

    it('should do nothing if quiz not found', async () => {
      mockQuizModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await service.deleteQuiz(validQuizId);
      expect(mockQuizModel.findById).toHaveBeenCalledWith(validQuizId);
      expect(mockQuizModel.deleteOne).not.toHaveBeenCalled();
      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });
  });
});
