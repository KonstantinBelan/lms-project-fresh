// src/tariffs/tariffs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tariff, TariffDocument } from './schemas/tariff.schema';

@Injectable()
export class TariffsService {
  constructor(
    @InjectModel(Tariff.name) private tariffModel: Model<TariffDocument>,
  ) {}

  async createTariff(
    courseId: string,
    name: string,
    price: number,
    accessibleModules: string[],
    includesHomeworks: boolean,
    includesPoints: boolean,
  ): Promise<TariffDocument> {
    const tariff = new this.tariffModel({
      courseId,
      name,
      price,
      accessibleModules: accessibleModules.map((id) => new Types.ObjectId(id)),
      includesHomeworks,
      includesPoints,
    });
    return tariff.save();
  }

  async findTariffById(tariffId: string): Promise<TariffDocument | null> {
    return this.tariffModel.findById(tariffId).lean().exec();
  }

  async getTariffsByCourse(courseId: string): Promise<TariffDocument[]> {
    return this.tariffModel.find({ courseId }).lean().exec();
  }
}
