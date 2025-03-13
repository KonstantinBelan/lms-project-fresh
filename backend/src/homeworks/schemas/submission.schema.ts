import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Homework } from './homework.schema';
import { User } from '../../users/schemas/user.schema';

export type SubmissionDocument = Submission &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ collection: 'submissions', timestamps: true })
export class Submission {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Homework' })
  homeworkId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  studentId: Types.ObjectId;

  @Prop({ required: true, maxlength: 5000 }) // Ограничиваем длину содержимого
  submissionContent: string;

  @Prop({ maxlength: 1000 }) // Ограничиваем длину комментария преподавателя
  teacherComment?: string;

  @Prop({ type: Number, min: 0, max: 100 }) // Оценка от 0 до 100
  grade?: number;

  @Prop({ default: false }) // Статус проверки
  isReviewed: boolean;

  __v: number;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
SubmissionSchema.index({ homeworkId: 1 }); // Индекс для поиска по homeworkId
SubmissionSchema.index({ studentId: 1 }); // Индекс для поиска по studentId
SubmissionSchema.index({ grade: 1 }); // Индекс для поиска по grade

// Хук перед сохранением для логирования
SubmissionSchema.pre('save', function (next) {
  console.log('Сохранение решения с homeworkId и studentId:', {
    homeworkId: this.homeworkId,
    studentId: this.studentId,
  });
  next();
});
