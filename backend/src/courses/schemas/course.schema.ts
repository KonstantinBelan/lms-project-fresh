import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Module } from './module.schema';

export type CourseDocument = Course & Document;

@Schema()
export class Course {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true, index: true })
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Module', index: true }] })
  modules: Types.ObjectId[];

  _id: Types.ObjectId;

  __v: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.index({ title: 1 }); // Индекс для title
CourseSchema.index({ description: 1 }); // Индекс для title
CourseSchema.index({ modules: 1 }); // Индекс для modules
