import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Course } from '../../courses/schemas/course.schema';

export type EnrollmentDocument = Enrollment & Document;

@Schema()
export class Enrollment extends Document {
  @Prop({ required: true, type: String, ref: 'User' })
  studentId: string;

  @Prop({ required: true, type: String, ref: 'Course' })
  courseId: Types.ObjectId; // Оставляем как ObjectId, без populate

  @Prop({ type: [String], default: [] })
  completedModules: string[];

  @Prop({ type: [String], default: [] })
  completedLessons: string[];

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean;

  @Prop({ type: Number, min: 0, max: 100 })
  grade?: number;

  @Prop({ type: Date })
  deadline?: Date;

  __v: number; // Mongoose version key
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
