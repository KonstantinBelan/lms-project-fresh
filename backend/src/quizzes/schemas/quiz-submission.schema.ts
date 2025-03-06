import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type QuizSubmissionDocument = QuizSubmission & Document;

@Schema()
export class QuizSubmission {
  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true })
  quizId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.Mixed], required: true }) // Поддержка number[] или string
  answers: (number[] | string)[];

  @Prop({ required: true })
  score: number;

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;
}

export const QuizSubmissionSchema =
  SchemaFactory.createForClass(QuizSubmission);
QuizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });
