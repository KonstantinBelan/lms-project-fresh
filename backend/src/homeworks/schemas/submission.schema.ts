import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({ required: true, maxlength: 5000 })
  submissionContent: string;

  @Prop({ maxlength: 1000 })
  teacherComment?: string;

  @Prop({ type: Number, min: 0, max: 100 })
  grade?: number;

  @Prop({ default: false })
  isReviewed: boolean;

  __v: number;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
SubmissionSchema.index({ homeworkId: 1 });
SubmissionSchema.index({ studentId: 1 });
SubmissionSchema.index({ grade: 1 });
SubmissionSchema.index(
  { homeworkId: 1, studentId: 1 },
  { unique: true }, // Уникальность комбинации homeworkId и studentId
);

SubmissionSchema.pre('save', function (next) {
  console.log('Сохранение решения с данными:', {
    homeworkId: this.homeworkId,
    studentId: this.studentId,
  });
  next();
});
