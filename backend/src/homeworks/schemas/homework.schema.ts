import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Lesson } from '../../courses/schemas/lesson.schema';

export type HomeworkDocument = Homework & Document;

@Schema({ collection: 'homeworks', timestamps: true })
export class Homework {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lesson' })
  lessonId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: true,
    enum: ['theory', 'practice', 'project'],
    default: 'practice',
  })
  category: string;

  @Prop({ type: Date }) // Уточняем тип как Date
  deadline?: Date;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: Number, default: 10, min: 0, max: 100 }) // Добавляем ограничения
  points: number;

  __v: number;
}

export const HomeworkSchema = SchemaFactory.createForClass(Homework);
HomeworkSchema.index({ lessonId: 1 }); // Индекс для поиска по lessonId
HomeworkSchema.index({ deadline: 1 }); // Индекс для поиска по deadline

// Явно расширяем интерфейс Homework для включения _id и опционального deadline
export interface Homework {
  _id: Types.ObjectId;
  lessonId: Types.ObjectId;
  description: string;
  category: string;
  deadline?: Date; // Сделали deadline опциональным, чтобы соответствовать классу
  isActive: boolean;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

// Хук перед сохранением для логирования
HomeworkSchema.pre('save', function (next) {
  console.log('Сохранение домашнего задания с lessonId:', this.lessonId);
  next();
});
