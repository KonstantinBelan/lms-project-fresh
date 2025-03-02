import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Module } from './module.schema';

export type CourseDocument = Course & Document;

@Schema()
export class Course {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], ref: 'Module', default: [] }) // Ссылка на модули
  modules: string[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);
