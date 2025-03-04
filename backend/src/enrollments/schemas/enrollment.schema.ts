import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Course } from '../../courses/schemas/course.schema';

export type EnrollmentDocument = Enrollment &
  Document & { _id: Types.ObjectId };

@Schema()
export class Enrollment extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  studentId: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Course', index: true })
  courseId: Types.ObjectId; // Оставляем как ObjectId, без populate

  @Prop({ type: [String], default: [], index: true })
  completedModules: string[];

  @Prop({ type: [String], default: [], index: true })
  completedLessons: string[];

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;

  @Prop({ type: Number, min: 0, max: 100 })
  grade?: number;

  @Prop({ type: Date, index: true })
  deadline?: Date;

  @Prop({ default: 0 })
  __v: number; // Mongoose version key
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ studentId: 1 });
EnrollmentSchema.index({ courseId: 1 });
EnrollmentSchema.index({ deadline: 1 });
EnrollmentSchema.index({ completedModules: 1 });
EnrollmentSchema.index({ completedLessons: 1 });
