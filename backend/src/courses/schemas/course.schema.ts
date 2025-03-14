import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Module } from './module.schema';

// Тип документа курса
export type CourseDocument = Course & Document;

// Схема курса
@Schema()
export class Course {
  @Prop({ required: true }) // Название курса, обязательное поле
  title: string;

  @Prop({ required: true }) // Описание курса, обязательное поле
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Module' }] }) // Массив ссылок на модули
  modules: Types.ObjectId[];

  @Prop({
    type: {
      lessons: { type: Number, default: 10 },
      modules: { type: Number, default: 50 },
      quizzes: { type: Number, default: 20 },
    },
    default: { lessons: 10, modules: 50, quizzes: 20 },
  }) // Конфигурация баллов за выполнение
  pointsConfig: {
    lessons: number;
    modules: number;
    quizzes: number;
  };

  _id: Types.ObjectId; // Уникальный идентификатор курса
  __v: number; // Версия документа
}

// Создание схемы для класса Course
export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.index({ title: 1 }); // Индекс для быстрого поиска по названию

// Интерфейс курса
export interface Course {
  _id: Types.ObjectId;
  title: string;
  description: string;
  modules: Types.ObjectId[];
  pointsConfig: IPointsConfig;
}

// Интерфейс конфигурации баллов
export interface IPointsConfig {
  lessons: number;
  modules: number;
  quizzes: number;
}
