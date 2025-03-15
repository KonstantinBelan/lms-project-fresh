import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

export interface IQuizQuestion {
  question: string;
  options?: string[];
  correctAnswers?: number[];
  correctTextAnswer?: string;
  weight: number;
  hint?: string;
}

export interface IQuiz {
  _id: string | Types.ObjectId; // Обновлено для совместимости
  lessonId: string | Types.ObjectId; // Обновлено для совместимости
  title: string;
  questions: IQuizQuestion[];
  timeLimit?: number;
}

@Schema()
export class QuizQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: false })
  options?: string[];

  @Prop({ type: [Number], required: false })
  correctAnswers?: number[];

  @Prop({ type: String, required: false })
  correctTextAnswer?: string;

  @Prop({ default: 1 })
  weight: number;

  @Prop({ type: String, required: false })
  hint?: string;
}

@Schema({ timestamps: true })
export class Quiz implements IQuiz {
  _id: string | Types.ObjectId; // Добавлено для совместимости

  @Prop({ type: Types.ObjectId, ref: 'Lesson', required: true })
  lessonId: string | Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: [QuizQuestion], required: true })
  questions: QuizQuestion[];

  @Prop({ type: Number, required: false })
  timeLimit?: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
QuizSchema.index({ lessonId: 1 });
