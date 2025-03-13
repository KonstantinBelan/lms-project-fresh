import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Lesson } from './lesson.schema';

export type ModuleDocument = Module & Document;

@Schema()
export class Module {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }] })
  lessons: Types.ObjectId[];

  _id: Types.ObjectId;

  __v: number;
}

export const ModuleSchema = SchemaFactory.createForClass(Module);
ModuleSchema.index({ title: 1 }); // Индекс для быстрого поиска по названию

export interface Module {
  _id: Types.ObjectId;
  title: string;
  lessons: Types.ObjectId[];
}
