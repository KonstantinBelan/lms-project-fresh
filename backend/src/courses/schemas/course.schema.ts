import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Module } from './module.schema';

export type CourseDocument = Course & Document;

@Schema()
export class Course {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Module' }] })
  modules: Types.ObjectId[];

  @Prop({
    type: {
      lessons: { type: Number, default: 10 },
      modules: { type: Number, default: 50 },
      quizzes: { type: Number, default: 20 },
    },
    default: { lessons: 10, modules: 50, quizzes: 20 },
  })
  pointsConfig: {
    lessons: number;
    modules: number;
    quizzes: number;
  };

  _id: Types.ObjectId;

  __v: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.index({ title: 1 }); // Индекс для title
CourseSchema.index({ description: 1 }); // Индекс для title
CourseSchema.index({ modules: 1 }); // Индекс для modules
