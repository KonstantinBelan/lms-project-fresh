import { Test, TestingModule } from '@nestjs/testing';
import { TariffsController } from './tariffs.controller';
import { TariffsService } from './tariffs.service';
import { CreateTariffDto } from './dto/create-tariff.dto';

describe('TariffsController', () => {
  let controller: TariffsController;
  let service: TariffsService;

  const mockTariffsService = {
    createTariff: jest.fn(),
    getTariffsByCourse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TariffsController],
      providers: [{ provide: TariffsService, useValue: mockTariffsService }],
    }).compile();

    controller = module.get<TariffsController>(TariffsController);
    service = module.get<TariffsService>(TariffsService);
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('createTariff', () => {
    it('должен создать тариф', async () => {
      const dto: CreateTariffDto = {
        courseId: '507f1f77bcf86cd799439011',
        name: 'Тест',
        price: 1000,
        accessibleModules: [],
        includesHomeworks: false,
        includesPoints: false,
      };
      const tariff = { ...dto, _id: '507f1f77bcf86cd799439012' };
      mockTariffsService.createTariff.mockResolvedValue(tariff);

      const result = await controller.createTariff(dto);
      expect(result).toEqual(expect.objectContaining({ _id: tariff._id }));
      expect(mockTariffsService.createTariff).toHaveBeenCalledWith(
        dto.courseId,
        dto.name,
        dto.price,
        dto.accessibleModules,
        dto.includesHomeworks,
        dto.includesPoints,
      );
    });
  });

  describe('getTariffsByCourse', () => {
    it('должен вернуть список тарифов', async () => {
      const courseId = '507f1f77bcf86cd799439011';
      const tariffs = [{ _id: '507f1f77bcf86cd799439012', name: 'Тест' }];
      mockTariffsService.getTariffsByCourse.mockResolvedValue(tariffs);

      const result = await controller.getTariffsByCourse(courseId);
      expect(result).toHaveLength(1);
      expect(mockTariffsService.getTariffsByCourse).toHaveBeenCalledWith(
        courseId,
      );
    });

    it('должен выбросить NotFoundException, если тарифы не найдены', async () => {
      mockTariffsService.getTariffsByCourse.mockResolvedValue([]);
      await expect(
        controller.getTariffsByCourse('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(
        'Тарифы для курса с ID 507f1f77bcf86cd799439011 не найдены',
      );
    });
  });
});
