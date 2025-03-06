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

  const mockQuizModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: validQuizId,
        lessonId: validLessonId,
        title: 'Test Quiz',
        questions: [{ question: 'Q1', correctAnswers: [0], weight: 1 }],
      }),
    }),
    create: jest.fn().mockResolvedValue({
      _id: validQuizId,
      lessonId: validLessonId,
      title: 'Test Quiz',
      questions: [{ question: 'Q1', correctAnswers: [0], weight: 1 }],
    }),
  };

  const mockQuizSubmissionModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: getModelToken('Quiz'), useValue: mockQuizModel },
        {
          provide: getModelToken('QuizSubmission'),
          useValue: mockQuizSubmissionModel,
        },
        { provide: getModelToken('Lesson'), useValue: {} },
        { provide: getModelToken('Module'), useValue: {} },
        { provide: getModelToken('Course'), useValue: {} },
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
      expect(mockQuizModel.create).toHaveBeenCalled();
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
      expect(result).toHaveProperty('score', 100);
    });

    it('should throw BadRequestException if quiz not found', async () => {
      mockQuizModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.submitQuiz(validStudentId, validQuizId, [[0]]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
