import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Lesson } from '../../courses/schemas/lesson.schema';

export type HomeworkDocument = Homework & Document; // Убедимся, что это определение корректно

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

  @Prop({})
  deadline?: Date; // Сделали deadline опциональным, чтобы соответствовать интерфейсу

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: Number, default: 10 }) // Добавляем баллы за домашку
  points: number;

  __v: number;
}

export const HomeworkSchema = SchemaFactory.createForClass(Homework);
HomeworkSchema.index({ lessonId: 1 }); // Индекс для lessonId
HomeworkSchema.index({ deadline: 1 }); // Индекс для deadline (опционально)

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

HomeworkSchema.pre('save', function (next) {
  console.log('Saving homework with lessonId:', this.lessonId);
  next();
});
