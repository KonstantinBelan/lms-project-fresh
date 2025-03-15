import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Тип для документа викторины
export type QuizDocument = Quiz & Document;

// Интерфейс для вопроса викторины
export interface IQuizQuestion {
  question: string; // Текст вопроса
  options?: string[]; // Варианты ответа (опционально)
  correctAnswers?: number[]; // Индексы правильных ответов (опционально)
  correctTextAnswer?: string; // Текстовый правильный ответ (опционально)
  weight: number; // Вес вопроса
  hint?: string; // Подсказка для вопроса (опционально)
}

// Интерфейс для викторины
export interface IQuiz {
  _id?: Types.ObjectId; // Уникальный идентификатор викторины
  lessonId: Types.ObjectId; // Ссылка на урок
  title: string; // Название викторины
  questions: IQuizQuestion[]; // Список вопросов
  timeLimit?: number; // Ограничение времени в минутах (опционально)
}

@Schema()
export class QuizQuestion {
  @Prop({ required: true })
  question: string; // Текст вопроса

  @Prop({ type: [String], required: false })
  options?: string[]; // Варианты ответа (опционально)

  @Prop({ type: [Number], required: false })
  correctAnswers?: number[]; // Индексы правильных ответов (опционально)

  @Prop({ type: String, required: false })
  correctTextAnswer?: string; // Текстовый правильный ответ (опционально)

  @Prop({ default: 1 })
  weight: number; // Вес вопроса, по умолчанию 1

  @Prop({ type: String, required: false })
  hint?: string; // Подсказка для вопроса (опционально)
}

@Schema()
export class Quiz implements IQuiz {
  @Prop({ type: Types.ObjectId, ref: 'Lesson', required: true })
  lessonId: Types.ObjectId; // Ссылка на урок

  @Prop({ required: true })
  title: string; // Название викторины

  @Prop({ type: [QuizQuestion], required: true })
  questions: QuizQuestion[]; // Список вопросов

  @Prop({ type: Number, required: false })
  timeLimit?: number; // Ограничение времени в минутах (опционально)
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
QuizSchema.index({ lessonId: 1 }); // Индекс для ускорения поиска по уроку
