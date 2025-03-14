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
    title: 'Тестовая викторина',
    questions: [
      { question: 'Q1', correctAnswers: [0], weight: 1, hint: 'Подсказка 1' },
      { question: 'Q2', correctAnswers: [1], weight: 2 },
    ],
    timeLimit: 10,
  };

  const mockLessonData = { _id: validLessonId, title: 'Тестовый урок' };
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
      title: 'Викторина завершена',
      message: 'Вы заработали {{points}} баллов за викторину "{{quizTitle}}"!',
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
        exec: jest.fn().mockResolvedValue({
          ...mockQuizData,
          title: 'Обновленная викторина',
        }),
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
    it('должен создать новую викторину', async () => {
      const result = await service.createQuiz(
        validLessonId,
        'Тестовая викторина',
        [
          {
            question: 'Q1',
            correctAnswers: [0],
            weight: 1,
            hint: 'Подсказка 1',
          },
        ],
      );
      expect(mockQuizModel).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', validQuizId);
    });
  });

  describe('findQuizById', () => {
    it('должен найти викторину по ID', async () => {
      const result = await service.findQuizById(validQuizId);
      expect(result).toEqual(mockQuizData);
    });

    it('должен вернуть null, если викторина не найдена', async () => {
      mockQuizModel.findById.mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });
      const result = await service.findQuizById(validQuizId);
      expect(result).toBeNull();
    });
  });

  describe('submitQuiz', () => {
    it('должен отправить викторину и начислить баллы', async () => {
      const result = await service.submitQuiz(validStudentId, validQuizId, [
        [0],
        [1],
      ]);
      expect(mockQuizModel.findById).toHaveBeenCalledWith(validQuizId);
      expect(mockQuizSubmissionModel).toHaveBeenCalled();
      expect(result).toHaveProperty('score', 100);
    });

    it('должен выбросить ошибку при повторной отправке', async () => {
      mockQuizSubmissionModel.findOne.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: 'submission1' }),
        }),
      });
      await expect(
        service.submitQuiz(validStudentId, validQuizId, [[0]]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubmissionsByStudentAndCourse', () => {
    it('должен вернуть отправки студента по курсу', async () => {
      mockQuizSubmissionModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest
              .fn()
              .mockResolvedValue([
                { quizId: mockQuizData, studentId: validStudentId },
              ]),
          }),
        }),
      });
      const result = await service.getSubmissionsByStudentAndCourse(
        validStudentId,
        validCourseId,
      );
      expect(result).toHaveLength(1);
    });
  });
});
