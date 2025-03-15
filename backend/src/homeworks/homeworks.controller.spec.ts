import { Test, TestingModule } from '@nestjs/testing';
import { HomeworksController } from './homeworks.controller';
import { HomeworksService } from './homeworks.service';
import { BadRequestException } from '@nestjs/common';

describe('HomeworksController', () => {
  let controller: HomeworksController;
  let service: HomeworksService;

  const mockHomeworksService = {
    createHomework: jest.fn(),
    updateHomework: jest.fn(),
    deleteHomework: jest.fn(),
    findHomeworkById: jest.fn(),
    findHomeworksByLesson: jest.fn(),
    createSubmission: jest.fn(),
    updateSubmission: jest.fn(),
    findSubmissionById: jest.fn(),
    findSubmissionsByHomework: jest.fn(),
    findSubmissionsByStudent: jest.fn(),
    autoCheckSubmission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeworksController],
      providers: [
        { provide: HomeworksService, useValue: mockHomeworksService },
      ],
    }).compile();

    controller = module.get<HomeworksController>(HomeworksController);
    service = module.get<HomeworksService>(HomeworksService);
  });

  it('должен быть определён', () => {
    expect(controller).toBeDefined();
  });

  describe('createHomework', () => {
    it('должен создать домашнее задание', async () => {
      const dto = { lessonId: '507f1f77bcf86cd799439011', description: 'Тест' };
      const result = { _id: '507f1f77bcf86cd799439012', ...dto };
      mockHomeworksService.createHomework.mockResolvedValue(result);
      expect(await controller.createHomework(dto)).toEqual(result);
    });

    it('должен выбросить исключение при ошибке сервиса', async () => {
      mockHomeworksService.createHomework.mockRejectedValue(new Error());
      await expect(
        controller.createHomework({ lessonId: 'invalid', description: 'Тест' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findHomeworkById', () => {
    it('должен выбросить исключение при некорректном ID', async () => {
      await expect(controller.findHomeworkById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('должен вернуть домашнее задание', async () => {
      const homework = { _id: '507f1f77bcf86cd799439011', description: 'Тест' };
      mockHomeworksService.findHomeworkById.mockResolvedValue(homework);
      expect(
        await controller.findHomeworkById('507f1f77bcf86cd799439011'),
      ).toEqual(homework);
    });
  });
});
