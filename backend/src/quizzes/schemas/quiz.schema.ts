import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

@Schema()
export class QuizQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: false }) // Опционально для множественного выбора
  options?: string[];

  @Prop({ type: [Number], required: false }) // Опционально для множественного выбора
  correctAnswers?: number[];

  @Prop({ type: String, required: false }) // Опционально для текстового ответа
  correctTextAnswer?: string;

  @Prop({ default: 1 })
  weight: number;

  @Prop({ type: String, required: false }) // Опциональная подсказка
  hint?: string;
}

@Schema()
export class Quiz {
  @Prop({ type: Types.ObjectId, ref: 'Lesson', required: true })
  lessonId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: [QuizQuestion], required: true })
  questions: QuizQuestion[];

  @Prop({ type: Number, required: false }) // Опциональный таймер в минутах
  timeLimit?: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
QuizSchema.index({ lessonId: 1 });
