// src/quizzes/quizzes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('QuizzesService', () => {
  let service: QuizzesService;

  const validQuizId = new Types.ObjectId().toString();
  const validLessonId = new Types.ObjectId().toString();
  const validStudentId = new Types.ObjectId().toString();

  const mockQuizData = {
    _id: validQuizId,
    lessonId: validLessonId,
    title: 'Test Quiz',
    questions: [{ question: 'Q1', correctAnswers: [0], weight: 1 }],
  };

  // Мок для quizModel как объект с методами и конструктором
  const mockQuizModel = {
    // Конструктор
    constructor: jest.fn().mockImplementation((data) => ({
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
    })),
    // Метод findById
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuizData),
      }),
    }),
  };

  // Мок для quizSubmissionModel как объект с методами и конструктором
  const mockQuizSubmissionModel = {
    // Конструктор
    constructor: jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        ...data,
        toObject: jest.fn().mockReturnValue(data),
      }),
    })),
    // Метод findOne
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    }),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const mockEnrollmentsService = {
    updateStudentProgress: jest.fn().mockResolvedValue(undefined),
  };

  const mockLessonModel = {};
  const mockModuleModel = {};
  const mockCourseModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: getModelToken('Quiz'),
          useValue: {
            ...mockQuizModel,
            // Указываем конструктор как функцию для new
            new: mockQuizModel.constructor,
          },
        },
        {
          provide: getModelToken('QuizSubmission'),
          useValue: {
            ...mockQuizSubmissionModel,
            // Указываем конструктор как функцию для new
            new: mockQuizSubmissionModel.constructor,
          },
        },
        { provide: getModelToken('Lesson'), useValue: mockLessonModel },
        { provide: getModelToken('Module'), useValue: mockModuleModel },
        { provide: getModelToken('Course'), useValue: mockCourseModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createQuiz', () => {
    it('should create a quiz successfully', async () => {
      const result = await service.createQuiz(validLessonId, 'Test Quiz', [
        { question: 'Q1', correctAnswers: [0], weight: 1 },
      ]);
      expect(mockQuizModel.constructor).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', validQuizId);
    });
  });

  describe('submitQuiz', () => {
    it('should submit quiz and calculate score', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null); // Нет таймера
      const result = await service.submitQuiz(validStudentId, validQuizId, [
        [0],
      ]);
      expect(mockQuizModel.findById).toHaveBeenCalledWith(validQuizId);
      expect(mockQuizSubmissionModel.constructor).toHaveBeenCalled();
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
});
