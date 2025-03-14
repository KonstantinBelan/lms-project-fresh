// src/tariffs/tariffs.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tariff, TariffDocument } from './schemas/tariff.schema';

@Injectable()
export class TariffsService {
  constructor(
    @InjectModel(Tariff.name) private tariffModel: Model<TariffDocument>,
  ) {}

  /**
   * Создаёт новый тариф для курса.
   * @param courseId - ID курса
   * @param name - Название тарифа
   * @param price - Цена тарифа
   * @param accessibleModules - Список ID доступных модулей
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
    return tariff.save();
  }

  /**
   * Находит тариф по ID.
   * @param tariffId - ID тарифа
   * @returns Тариф или null, если не найден
   */
  async findTariffById(tariffId: string): Promise<Tariff | null> {
    return this.tariffModel.findById(tariffId).lean().exec();
  }

  /**
   * Получает все тарифы для курса.
   * @param courseId - ID курса
   * @returns Список тарифов
   */
  async getTariffsByCourse(courseId: string): Promise<Tariff[]> {
    return this.tariffModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .lean()
      .exec();
  }
}
