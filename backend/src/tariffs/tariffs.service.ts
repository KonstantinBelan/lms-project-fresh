import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tariff, TariffDocument } from './schemas/tariff.schema';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class TariffsService {
  constructor(
    @InjectModel(Tariff.name) private tariffModel: Model<TariffDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Создает новый тариф для курса.
   * @param courseId - Идентификатор курса
   * @param name - Название тарифа
   * @param price - Цена тарифа
   * @param accessibleModules - Список идентификаторов доступных модулей
   * @param includesHomeworks - Включает ли домашние задания
   * @param includesPoints - Включает ли накопление баллов
   * @returns Созданный тариф
   * @throws BadRequestException если цена отрицательная
   */
  async createTariff(
    courseId: string,
    name: string,
    price: number,
    accessibleModules: string[],
    includesHomeworks: boolean,
    includesPoints: boolean,
  ): Promise<TariffDocument> {
    if (price < 0) {
      throw new BadRequestException('Цена тарифа не может быть отрицательной');
    }

    const tariff = new this.tariffModel({
      courseId: new Types.ObjectId(courseId),
      name,
      price,
      accessibleModules: accessibleModules.map((id) => new Types.ObjectId(id)),
      includesHomeworks,
      includesPoints,
    });

    // Сбрасываем кеш для курса после создания нового тарифа
    await this.cacheManager.del(`tariffs_course_${courseId}`);
    return tariff.save();
  }

  /**
   * Находит тариф по идентификатору.
   * @param tariffId - Идентификатор тарифа
   * @returns Тариф или null, если не найден
   */
  async findTariffById(tariffId: string): Promise<Tariff | null> {
    const cacheKey = `tariff_${tariffId}`;
    const cachedTariff = await this.cacheManager.get<Tariff>(cacheKey);

    if (cachedTariff) {
      return cachedTariff;
    }

    const tariff = await this.tariffModel.findById(tariffId).lean().exec();
    if (tariff) {
      await this.cacheManager.set(cacheKey, tariff, 600); // Кеш на 10 минут
    }
    return tariff;
  }

  /**
   * Получает все тарифы для курса с использованием кеширования.
   * @param courseId - Идентификатор курса
   * @returns Список тарифов
   */
  async getTariffsByCourse(courseId: string): Promise<Tariff[]> {
    const cacheKey = `tariffs_course_${courseId}`;
    const cachedTariffs = await this.cacheManager.get<Tariff[]>(cacheKey);

    if (cachedTariffs) {
      return cachedTariffs;
    }

    const tariffs = await this.tariffModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();

    await this.cacheManager.set(cacheKey, tariffs, 600); // Кеш на 10 минут
    return tariffs;
  }
}
