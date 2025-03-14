import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Tariff {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId; // ID курса, к которому относится тариф

  @Prop({ required: true })
  name: string; // Название тарифа

  @Prop({ required: true })
  price: number; // Цена тарифа

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Module' }], default: [] })
  accessibleModules: Types.ObjectId[]; // Список доступных модулей

  @Prop({ default: false })
  includesHomeworks: boolean; // Включает ли тариф доступ к домашним заданиям

  @Prop({ default: false })
  includesPoints: boolean; // Включает ли тариф накопление баллов
}

export type TariffDocument = Tariff & Document;
export const TariffSchema = SchemaFactory.createForClass(Tariff);

// Добавляем индекс для ускорения запросов по courseId
TariffSchema.index({ courseId: 1 });
