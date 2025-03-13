import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Lesson {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string; // Текст, HTML или ссылка на файл

  @Prop({ type: String, default: null }) // Опциональное поле для мультимедиа
  media?: string;

  @Prop({ type: Number, default: 1 }) // Баллы за завершение урока
  points: number;

  _id: Types.ObjectId;

  __v: number;
}

export type LessonDocument = Lesson & Document;
export const LessonSchema = SchemaFactory.createForClass(Lesson);
LessonSchema.index({ title: 1 }); // Индекс для быстрого поиска по названию

export interface Lesson {
  _id: Types.ObjectId;
  title: string;
  content: string;
  media?: string;
  points: number;
}
