import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Lesson } from '../../courses/schemas/lesson.schema';

export type HomeworkDocument = Homework & Document;

@Schema({ collection: 'homeworks', timestamps: true }) // Добавляем timestamps для создания и обновления
export class Homework {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Lesson', index: true }) // Ссылка на урок
  lessonId: Types.ObjectId;

  @Prop({ required: true }) // Текст или описание задания
  description: string;

  @Prop({
    required: true,
    enum: ['theory', 'practice', 'project'],
    default: 'practice',
  }) // Категория задания
  category: string;

  @Prop() // Дедлайн (опционально)
  deadline?: Date;

  @Prop({ default: false }) // Статус активности задания
  isActive: boolean;

  __v: number;
}

export const HomeworkSchema = SchemaFactory.createForClass(Homework);
HomeworkSchema.index({ lessonId: 1 }); // Индекс для быстрого поиска по уроку
