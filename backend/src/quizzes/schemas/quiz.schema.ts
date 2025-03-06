import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

@Schema()
export class Quiz {
  @Prop({ type: Types.ObjectId, ref: 'Lesson', required: true })
  lessonId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({
    type: [
      {
        question: { type: String, required: true },
        options: { type: [String], required: true },
        correctAnswer: { type: Number, required: true }, // Индекс правильного ответа в options
      },
    ],
    required: true,
  })
  questions: { question: string; options: string[]; correctAnswer: number }[];
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
QuizSchema.index({ lessonId: 1 });
