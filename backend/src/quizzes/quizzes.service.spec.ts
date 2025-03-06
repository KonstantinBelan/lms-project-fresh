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
  findOne?: jest.Mock;
}

describe('QuizzesService', () => {
  let service: QuizzesService;

  const validQuizId = new Types.ObjectId().toString();
  const validLessonId = new Types.ObjectId().toString();
  const validStudentId = new Types.ObjectId().toString();
  const validModuleId = new Types.ObjectId().toString();

  const mockQuizData = {
    _id: validQuizId,
    lessonId: validLessonId,
    title: 'Test Quiz',
    questions: [{ question: 'Q1', correctAnswers: [0], weight: 1 }],
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

  mockQuizModel.findById = jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockQuizData),
    }),
  });

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

  mockQuizSubmissionModel.findOne = jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    }),
  });

  // Мок для lessonModel
  const mockLessonModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLessonData),
      }),
    }),
  };

  // Мок для moduleModel
  const mockModuleModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockModuleData),
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

  const mockCourseModel = {};

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
  });

  afterEach(() => jest.clearAllMocks());

  describe('createQuiz', () => {
    it('should create a quiz successfully', async () => {
      const result = await service.createQuiz(validLessonId, 'Test Quiz', [
        { question: 'Q1', correctAnswers: [0], weight: 1 },
      ]);
      expect(mockQuizModel).toHaveBeenCalled();
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
      expect(mockQuizSubmissionModel).toHaveBeenCalled();
      expect(mockLessonModel.findById).toHaveBeenCalledWith(validLessonId);
      expect(mockModuleModel.findOne).toHaveBeenCalledWith({
        lessons: validLessonId,
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
});
