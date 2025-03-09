// src/tariffs/schemas/tariff.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Tariff {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  name: string; // "Только посмотреть", "Стандарт", "Максимум"

  @Prop({ required: true })
  price: number;

  @Prop({ type: [Types.ObjectId], ref: 'Module', default: [] })
  accessibleModules: Types.ObjectId[]; // Модули, доступные по тарифу

  @Prop({ type: Boolean, default: false })
  includesHomeworks: boolean; // Доступ к домашкам

  @Prop({ type: Boolean, default: false })
  includesPoints: boolean; // Подсчёт баллов
}

export type TariffDocument = Tariff & Document;
export const TariffSchema = SchemaFactory.createForClass(Tariff);
