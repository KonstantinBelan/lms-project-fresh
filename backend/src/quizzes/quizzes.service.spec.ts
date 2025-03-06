// backend/src/quizzes/quizzes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('QuizzesService', () => {
  let service: QuizzesService;

  const mockQuizModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '1',
        lessonId: 'lesson1',
        title: 'Test Quiz',
        questions: [{ question: 'Q1', correctAnswers: [0], weight: 1 }],
      }),
    }),
    create: jest.fn().mockResolvedValue({
      _id: '1',
      lessonId: 'lesson1',
      title: 'Test Quiz',
      questions: [{ question: 'Q1', correctAnswers: [0], weight: 1 }],
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
      const result = await service.createQuiz('lesson1', 'Test Quiz', [
        { question: 'Q1', correctAnswers: [0], weight: 1 },
      ]);
      expect(mockQuizModel.create).toHaveBeenCalledWith({
        lessonId: new Types.ObjectId('lesson1'),
        title: 'Test Quiz',
        questions: [{ question: 'Q1', correctAnswers: [0], weight: 1 }],
      });
      expect(result).toHaveProperty('_id', '1');
    });
  });

  describe('submitQuiz', () => {
    it('should submit quiz and calculate score', async () => {
      const result = await service.submitQuiz('student1', '1', [[0]]);
      expect(mockQuizModel.findById).toHaveBeenCalledWith('1');
      expect(mockEnrollmentsService.updateStudentProgress).toHaveBeenCalled();
      expect(result).toHaveProperty('score', 100);
    });

    it('should throw BadRequestException if quiz not found', async () => {
      mockQuizModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });
      await expect(service.submitQuiz('student1', '1', [[0]])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getQuizHints', () => {
    it('should return quiz hints', async () => {
      const result = await service.getQuizHints('1');
      expect(result).toEqual([{ question: 'Q1', hint: undefined }]);
    });
  });
});
