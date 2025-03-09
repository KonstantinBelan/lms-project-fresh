// src/tariffs/schemas/tariff.schema.ts (пример)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Tariff {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Module' }], default: [] })
  accessibleModules: Types.ObjectId[];

  @Prop({ default: false })
  includesHomeworks: boolean;

  @Prop({ default: false })
  includesPoints: boolean;
}

export type TariffDocument = Tariff & Document;
export const TariffSchema = SchemaFactory.createForClass(Tariff);
