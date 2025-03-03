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

  _id: Types.ObjectId;

  __v: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
