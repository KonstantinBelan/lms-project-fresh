import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Тип для документа зачисления
export type EnrollmentDocument = Enrollment &
  Document & { _id: Types.ObjectId };

// Схема зачисления
@Schema({ timestamps: true })
export class Enrollment extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  studentId: string; // Идентификатор студента

  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId; // Идентификатор курса

  @Prop({ type: Types.ObjectId, ref: 'Stream', required: false })
  streamId?: Types.ObjectId; // Идентификатор потока (опционально)

  @Prop({ type: Types.ObjectId, ref: 'Tariff', required: false })
  tariffId?: Types.ObjectId; // Идентификатор тарифа (опционально)

  @Prop({ type: [String], default: [] })
  completedModules: string[]; // Список завершенных модулей

  @Prop({ type: [String], default: [] })
  completedLessons: string[]; // Список завершенных уроков

  @Prop({ type: Boolean, default: false })
  isCompleted: boolean; // Завершен ли курс

  @Prop({ type: Number, min: 0, max: 100 })
  grade?: number; // Оценка за курс (опционально)

  @Prop({ type: Date })
  deadline?: Date; // Дедлайн курса (опционально)

  @Prop({ type: Number, default: 0 })
  points: number; // Количество набранных баллов

  @Prop({ default: 0 })
  __v: number; // Версия документа Mongoose
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Индексы для оптимизации запросов
EnrollmentSchema.index({ studentId: 1 });
EnrollmentSchema.index({ courseId: 1 });
EnrollmentSchema.index({ deadline: 1 });
EnrollmentSchema.index({ completedModules: 1 });
EnrollmentSchema.index({ completedLessons: 1 });
EnrollmentSchema.index({ studentId: 1, courseId: 1 });
