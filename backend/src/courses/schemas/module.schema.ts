import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Lesson } from './lesson.schema';

export type ModuleDocument = Module & Document;

@Schema()
export class Module {
  @Prop({ required: true })
  title: string;

  // @Prop({ type: [String], ref: 'Lesson', default: [] }) // Ссылка на уроки
  // lessons: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }] })
  lessons: Types.ObjectId[]; // Явно указываем тип Lesson[]

  _id: Types.ObjectId;

  __v: number; // Mongoose version key
}

export const ModuleSchema = SchemaFactory.createForClass(Module);
