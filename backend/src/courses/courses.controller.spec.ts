import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCourse = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Тестовый курс',
    description: 'Тестовое описание',
  };

  const mockCoursesService = {
    createCourse: jest.fn().mockResolvedValue(mockCourse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: mockCoursesService }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('должен создать курс', async () => {
      const dto = { title: 'Тестовый курс', description: 'Тестовое описание' };
      const result = await controller.create(dto);
      expect(result).toEqual(mockCourse);
      expect(service.createCourse).toHaveBeenCalledWith(dto);
    });
  });

  describe('createModule', () => {
    it('должен создать модуль', async () => {
      const dto = { title: 'Тестовый модуль', description: 'Описание' };
      const mockModule = {
        _id: '507f1f77bcf86cd799439012',
        ...dto,
        lessons: [],
      };
      mockCoursesService.createModule = jest.fn().mockResolvedValue(mockModule);
      const result = await controller.createModule(
        '507f1f77bcf86cd799439011',
        dto,
      );
      expect(result).toEqual(mockModule);
      expect(service.createModule).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dto,
      );
    });
  });

  describe('createLesson', () => {
    it('должен создать урок', async () => {
      const dto = { title: 'Тестовый урок', content: 'Содержимое' };
      const mockLesson = { _id: '507f1f77bcf86cd799439013', ...dto, points: 1 };
      mockCoursesService.createLesson = jest.fn().mockResolvedValue(mockLesson);
      const result = await controller.createLesson(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        dto,
      );
      expect(result).toEqual(mockLesson);
      expect(service.createLesson).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        dto,
      );
    });
  });
});
