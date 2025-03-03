import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Homework } from './homework.schema';
import { User } from '../../users/schemas/user.schema';

export type SubmissionDocument = Submission & Document;

@Schema({ collection: 'submissions', timestamps: true })
export class Submission {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Homework', index: true })
  homeworkId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true }) // Решение (текст, ссылка, или путь к файлу)
  submissionContent: string;

  @Prop() // Комментарий от преподавателя
  teacherComment?: string;

  @Prop({ type: Number, min: 0, max: 100, index: true }) // Оценка (0–100)
  grade?: number;

  @Prop({ default: false }) // Статус проверки
  isReviewed: boolean;

  __v: number;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
SubmissionSchema.index({ homeworkId: 1 }); // Индекс для homeworkId
SubmissionSchema.index({ studentId: 1 }); // Индекс для studentId
SubmissionSchema.index({ grade: 1 }); // Индекс для grade (опционально)

SubmissionSchema.pre('save', function (next) {
  console.log('Saving submission with homeworkId and studentId:', {
    homeworkId: this.homeworkId,
    studentId: this.studentId,
  });
  next();
});
