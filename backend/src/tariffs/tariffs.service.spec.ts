import { Test, TestingModule } from '@nestjs/testing';
import { TariffsService } from './tariffs.service';
import { getModelToken } from '@nestjs/mongoose';
import { Tariff } from './schemas/tariff.schema';
import { BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('TariffsService', () => {
  let service: TariffsService;
  let tariffModel: any;
  let cacheManager: Cache;

  const mockTariffModel = {
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TariffsService,
        {
          provide: getModelToken(Tariff.name),
          useValue: mockTariffModel,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<TariffsService>(TariffsService);
    tariffModel = module.get(getModelToken(Tariff.name));
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('createTariff', () => {
    it('должен создать тариф', async () => {
      const tariffData = {
        courseId: '507f1f77bcf86cd799439011',
        name: 'Тестовый тариф',
        price: 1000,
        accessibleModules: ['507f1f77bcf86cd799439012'],
        includesHomeworks: true,
        includesPoints: false,
      };

      const tariffDoc = {
        ...tariffData,
        save: jest.fn().mockResolvedValue(tariffData),
      };
      mockTariffModel.create.mockReturnValue(tariffDoc);

      const result = await service.createTariff(
        tariffData.courseId,
        tariffData.name,
        tariffData.price,
        tariffData.accessibleModules,
        tariffData.includesHomeworks,
        tariffData.includesPoints,
      );

      expect(mockTariffModel.create).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledWith(
        `tariffs_course_${tariffData.courseId}`,
      );
      expect(result).toEqual(tariffData);
    });

    it('должен выбросить исключение при отрицательной цене', async () => {
      await expect(
        service.createTariff(
          '507f1f77bcf86cd799439011',
          'Тест',
          -100,
          [],
          false,
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findTariffById', () => {
    it('должен вернуть тариф из кеша', async () => {
      const tariffId = '507f1f77bcf86cd799439011';
      const cachedTariff = { _id: tariffId, name: 'Тест' };
      mockCacheManager.get.mockResolvedValue(cachedTariff);

      const result = await service.findTariffById(tariffId);
      expect(result).toEqual(cachedTariff);
      expect(mockTariffModel.findById).not.toHaveBeenCalled();
    });

    it('должен найти тариф в базе и сохранить в кеш', async () => {
      const tariffId = '507f1f77bcf86cd799439011';
      const tariff = { _id: tariffId, name: 'Тест' };
      mockCacheManager.get.mockResolvedValue(null);
      mockTariffModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(tariff),
      });

      const result = await service.findTariffById(tariffId);
      expect(result).toEqual(tariff);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `tariff_${tariffId}`,
        tariff,
        { ttl: 600 },
      );
    });
  });
});
