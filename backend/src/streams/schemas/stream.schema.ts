import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Stream {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId; // ID курса, к которому относится поток

  @Prop({ required: true })
  name: string; // Название потока, например, "Поток 1 - Март 2025"

  @Prop({ required: true })
  startDate: Date; // Дата начала потока

  @Prop({ required: true })
  endDate: Date; // Дата окончания потока

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  students: Types.ObjectId[]; // Список ID студентов в потоке
}

export type StreamDocument = Stream & Document;
export const StreamSchema = SchemaFactory.createForClass(Stream);

// Добавляем индекс для ускорения запросов по courseId
StreamSchema.index({ courseId: 1 });
