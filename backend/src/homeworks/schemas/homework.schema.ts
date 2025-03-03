import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Lesson } from '../../courses/schemas/lesson.schema';

export type HomeworkDocument = Homework & Document; // Убедимся, что это определение корректно

@Schema({ collection: 'homeworks', timestamps: true })
export class Homework {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lesson', index: true })
  lessonId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: true,
    enum: ['theory', 'practice', 'project'],
    default: 'practice',
  })
  category: string;

  @Prop({ index: true })
  deadline?: Date;

  @Prop({ default: false })
  isActive: boolean;

  __v: number;
}

export const HomeworkSchema = SchemaFactory.createForClass(Homework);
HomeworkSchema.index({ lessonId: 1 });

HomeworkSchema.pre('save', function (next) {
  console.log('Saving homework with lessonId:', this.lessonId);
  next();
});
HomeworkSchema.index({ lessonId: 1 }); // Индекс для lessonId
HomeworkSchema.index({ deadline: 1 }); // Индекс для deadline (опционально)
