import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Схема урока
@Schema()
export class Lesson {
  @Prop({ required: true }) // Название урока, обязательное поле
  title: string;

  @Prop({ required: true }) // Содержимое урока (текст, HTML или ссылка), обязательное поле
  content: string;

  @Prop({ type: String, default: null }) // Опциональная ссылка на мультимедиа
  media?: string;

  @Prop({ type: Number, default: 1 }) // Баллы за завершение урока, по умолчанию 1
  points: number;

  _id: Types.ObjectId; // Уникальный идентификатор урока
  __v: number; // Версия документа
}

// Тип документа урока
export type LessonDocument = Lesson & Document;

// Создание схемы для класса Lesson
export const LessonSchema = SchemaFactory.createForClass(Lesson);
LessonSchema.index({ title: 1 }); // Индекс для быстрого поиска по названию

// Интерфейс урока
export interface Lesson {
  _id: Types.ObjectId;
  title: string;
  content: string;
  media?: string;
  points: number;
}
