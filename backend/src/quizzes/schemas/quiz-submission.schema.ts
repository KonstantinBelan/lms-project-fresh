import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type QuizSubmissionDocument = QuizSubmission & Document;

@Schema()
export class QuizSubmission {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true }) // Ссылка на викторину
  quizId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) // Ссылка на студента
  studentId: Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.Mixed], required: true }) // Ответы студента (массив чисел или строка)
  answers: (number[] | string)[];

  @Prop({ required: true }) // Итоговая оценка в процентах
  score: number;

  @Prop({ type: Date, default: Date.now }) // Дата отправки
  submittedAt: Date;
}

export const QuizSubmissionSchema =
  SchemaFactory.createForClass(QuizSubmission);
QuizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true }); // Уникальный индекс для предотвращения повторных отправок
