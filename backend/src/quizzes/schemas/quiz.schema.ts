import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

@Schema()
export class QuizQuestion {
  @Prop({ required: true }) // Текст вопроса
  question: string;

  @Prop({ type: [String], required: false }) // Варианты ответа (опционально)
  options?: string[];

  @Prop({ type: [Number], required: false }) // Индексы правильных ответов (опционально)
  correctAnswers?: number[];

  @Prop({ type: String, required: false }) // Текстовый правильный ответ (опционально)
  correctTextAnswer?: string;

  @Prop({ default: 1 }) // Вес вопроса, по умолчанию 1
  weight: number;

  @Prop({ type: String, required: false }) // Подсказка для вопроса (опционально)
  hint?: string;
}

@Schema()
export class Quiz {
  _id?: Types.ObjectId; // Добавляем _id как опциональное поле

  @Prop({ type: Types.ObjectId, ref: 'Lesson', required: true }) // Ссылка на урок
  lessonId: Types.ObjectId;

  @Prop({ required: true }) // Название викторины
  title: string;

  @Prop({ type: [QuizQuestion], required: true }) // Список вопросов
  questions: QuizQuestion[];

  @Prop({ type: Number, required: false }) // Ограничение времени в минутах (опционально)
  timeLimit?: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
QuizSchema.index({ lessonId: 1 }); // Индекс для быстрого поиска по уроку
