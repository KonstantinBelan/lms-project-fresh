import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Course } from '../../courses/schemas/course.schema';

export type EnrollmentDocument = Enrollment & Document;

@Schema()
export class Enrollment {
  @Prop({ type: String, ref: 'User', required: true })
  studentId: string; // Ссылка на пользователя (студента)

  @Prop({ type: String, ref: 'Course', required: true })
  courseId: string; // Ссылка на курс

  @Prop({ type: [String], ref: 'Module', default: [] }) // Прогресс по модулям
  completedModules: string[];

  @Prop({ type: [String], ref: 'Lesson', default: [] }) // Прогресс по урокам
  completedLessons: string[];

  @Prop({ type: Number, default: 0 }) // Общая оценка (0-100)
  grade: number;

  @Prop({ type: Boolean, default: false }) // Завершён ли курс
  isCompleted: boolean;

  @Prop({ type: Date, default: Date.now }) // Дата записи
  enrollmentDate: Date;

  @Prop({ type: Date })
  deadline?: Date;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
