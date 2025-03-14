import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type QuizSubmissionDocument = QuizSubmission & Document;

// Интерфейс для отправки викторины
export interface IQuizSubmission {
  quizId: Types.ObjectId; // Ссылка на викторину
  studentId: Types.ObjectId; // Ссылка на студента
  answers: (number[] | string)[]; // Ответы студента
  score: number; // Оценка в процентах
  submittedAt: Date; // Дата отправки
}

@Schema()
export class QuizSubmission implements IQuizSubmission {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
  quizId: Types.ObjectId; // Ссылка на викторину

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId; // Ссылка на студента

  @Prop({ type: [MongooseSchema.Types.Mixed], required: true })
  answers: (number[] | string)[]; // Ответы студента (массив чисел или строка)

  @Prop({ required: true })
  score: number; // Итоговая оценка в процентах

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date; // Дата отправки
}

export const QuizSubmissionSchema =
  SchemaFactory.createForClass(QuizSubmission);
QuizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true }); // Уникальный индекс для предотвращения повторных отправок
