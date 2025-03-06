import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizSubmissionDocument = QuizSubmission & Document;

@Schema()
export class QuizSubmission {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
  quizId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: [[Number]], required: true }) // Массив массивов ответов
  answers: number[][];

  @Prop({ required: true })
  score: number; // Оценка в процентах (0-100)

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;
}

export const QuizSubmissionSchema =
  SchemaFactory.createForClass(QuizSubmission);
QuizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true }); // Уникальность для пары quizId-studentId
