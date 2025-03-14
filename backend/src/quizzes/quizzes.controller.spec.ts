import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

describe('QuizzesController', () => {
  let controller: QuizzesController;
  let service: QuizzesService;

  const mockQuizzesService = {
    createQuiz: jest.fn(),
    findQuizById: jest.fn(),
    findQuizzesByLesson: jest.fn(),
    updateQuiz: jest.fn(),
    deleteQuiz: jest.fn(),
    submitQuiz: jest.fn(),
    getQuizSubmission: jest.fn(),
    getQuizHints: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [
        { provide: QuizzesService, useValue: mockQuizzesService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    controller = module.get<QuizzesController>(QuizzesController);
    service = module.get<QuizzesService>(QuizzesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('должен создать викторину', async () => {
    const dto: CreateQuizDto = {
      lessonId: '1',
      title: 'Test',
      questions: [{ question: 'Q1', correctAnswers: [0] }],
    };
    mockQuizzesService.createQuiz.mockResolvedValue(dto);
    const result = await controller.createQuiz(dto);
    expect(result).toEqual(dto);
    expect(mockQuizzesService.createQuiz).toHaveBeenCalledWith(
      dto.lessonId,
      dto.title,
      dto.questions,
      undefined,
    );
  });

  it('должен найти викторину по ID', async () => {
    const quizId = '1';
    const quiz = { _id: quizId, title: 'Test' };
    mockQuizzesService.findQuizById.mockResolvedValue(quiz);
    const result = await controller.findQuizById(quizId);
    expect(result).toEqual(quiz);
  });

  it('должен отправить викторину', async () => {
    const quizId = '1';
    const dto: SubmitQuizDto = { studentId: '1', answers: [[0]] };
    const submission = { ...dto, score: 100 };
    mockQuizzesService.submitQuiz.mockResolvedValue(submission);
    const result = await controller.submitQuiz(quizId, dto);
    expect(result).toEqual(submission);
  });
});
