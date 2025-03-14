import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Lesson } from './lesson.schema';

// Тип документа модуля
export type ModuleDocument = Module & Document;

// Схема модуля
@Schema()
export class Module {
  @Prop({ required: true }) // Название модуля, обязательное поле
  title: string;

  @Prop() // Описание модуля, опциональное поле
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Lesson' }] }) // Массив ссылок на уроки
  lessons: Types.ObjectId[];

  _id: Types.ObjectId; // Уникальный идентификатор модуля
  __v: number; // Версия документа
}

// Создание схемы для класса Module
export const ModuleSchema = SchemaFactory.createForClass(Module);
ModuleSchema.index({ title: 1 }); // Индекс для быстрого поиска по названию

// Интерфейс модуля
export interface Module {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  lessons: Types.ObjectId[];
}
