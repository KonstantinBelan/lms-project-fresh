import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Lesson } from './lesson.schema';

export type ModuleDocument = Module & Document;

@Schema()
export class Module {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [String], ref: 'Lesson', default: [] }) // Ссылка на уроки
  lessons: string[];
}

export const ModuleSchema = SchemaFactory.createForClass(Module);
