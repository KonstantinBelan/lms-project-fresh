import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

interface MockModel {
  new (data: any): { save: jest.Mock; toObject: jest.Mock; [key: string]: any };
  findById: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
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
    timeLimit: 10,
  };

  const mockLessonData = { _id: validLessonId, title: 'Test Lesson' };
  const mockModuleData = { _id: validModuleId, lessons: [validLessonId] };
  const mockCourseData = { _id: validCourseId, modules: [validModuleId] };

  const mockQuizModel: MockModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: validQuizId,
    save: jest.fn().mockResolvedValue({
      ...data,
      _id: validQuizId,
      toObject: jest.fn().mockReturnValue({ ...data, _id: validQuizId }),
    }),
  })) as any;

  mockQuizModel.findById = jest.fn();
  mockQuizModel.find = jest.fn();
  mockQuizModel.findByIdAndUpdate = jest.fn();
  mockQuizModel.deleteOne = jest.fn();

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

  const mockLessonModel = { findById: jest.fn() };
  const mockModuleModel = { findOne: jest.fn() };
  const mockCourseModel = { findOne: jest.fn() };

  const mockCacheManager = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const mockEnrollmentsService = {
    updateStudentProgress: jest.fn(),
    awardPoints: jest.fn().mockResolvedValue({ _id: 'enrollment1' }),
  };
  const mockNotificationsService = {
    getNotificationByKey: jest.fn().mockResolvedValue({
      title: 'Quiz Completed',
      message: 'You earned {{points}} points for quiz "{{quizTitle}}"!',
    }),
    createNotification: jest.fn().mockResolvedValue({ _id: 'notification1' }),
    sendNotificationToUser: jest.fn().mockResolvedValue(undefined),
    replacePlaceholders: jest
      .fn()
      .mockImplementation((template, params) =>
        template
          .replace('{{points}}', params.points)
          .replace('{{quizTitle}}', params.quizTitle),
      ),
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
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);

    mockQuizModel.findById.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuizData),
      }),
    });
    mockQuizModel.find.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockQuizData]),
      }),
    });
    mockQuizModel.findByIdAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockQuizData, title: 'Updated Quiz' }),
      }),
    });
    mockQuizModel.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });
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
    it('должен успешно создать викторину', async () => {
      const result = await service.createQuiz(validLessonId, 'Test Quiz', [
        { question: 'Q1', correctAnswers: [0], weight: 1, hint: 'Hint 1' },
      ]);
      expect(mockQuizModel).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', validQuizId);
    });
  });

  describe('submitQuiz', () => {
    it('должен успешно отправить викторину и начислить баллы', async () => {
      const result = await service.submitQuiz(validStudentId, validQuizId, [
        [0],
        [1],
      ]);
      expect(mockQuizModel.findById).toHaveBeenCalledWith(validQuizId);
      expect(mockQuizSubmissionModel).toHaveBeenCalled();
      expect(result).toHaveProperty('score', 100);
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
      expect(
        mockNotificationsService.sendNotificationToUser,
      ).toHaveBeenCalledWith('notification1', validStudentId);
    });

    it('должен выбросить исключение, если викторина уже отправлена', async () => {
      mockQuizSubmissionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: 'submission1' }),
        }),
      });
      await expect(
        service.submitQuiz(validStudentId, validQuizId, [[0]]),
      ).rejects.toThrow(BadRequestException);
    });

    it('должен выбросить исключение, если викторина не найдена', async () => {
      mockQuizModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(
        service.submitQuiz(validStudentId, validQuizId, [[0]]),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить исключение, если количество ответов не соответствует вопросам', async () => {
      await expect(
        service.submitQuiz(validStudentId, validQuizId, [[0]]), // Только 1 ответ вместо 2
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getQuizHints', () => {
    it('должен вернуть подсказки для вопросов викторины', async () => {
      const result = await service.getQuizHints(validQuizId);
      expect(mockQuizModel.findById).toHaveBeenCalledWith(validQuizId);
      expect(result).toEqual([
        { question: 'Q1', hint: 'Hint 1' },
        { question: 'Q2', hint: undefined },
      ]);
    });

    it('должен выбросить исключение, если викторина не найдена', async () => {
      mockQuizModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });
      await expect(service.getQuizHints(validQuizId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateQuiz', () => {
    it('должен обновить викторину и очистить кэш', async () => {
      const updateData = { title: 'Updated Quiz' };
      const result = await service.updateQuiz(validQuizId, updateData);
      expect(mockQuizModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validQuizId,
        updateData,
        { new: true },
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(`quiz:${validQuizId}`);
      expect(result).toHaveProperty('title', 'Updated Quiz');
    });
  });

  describe('deleteQuiz', () => {
    it('должен удалить викторину и очистить кэш', async () => {
      await service.deleteQuiz(validQuizId);
      expect(mockQuizModel.deleteOne).toHaveBeenCalledWith({
        _id: validQuizId,
      });
      expect(mockCacheManager.del).toHaveBeenCalledWith(`quiz:${validQuizId}`);
    });
  });
});
