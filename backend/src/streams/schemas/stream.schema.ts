// src/streams/schemas/stream.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Stream {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  name: string; // Например, "Поток 1", "Март 2025"

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  students: Types.ObjectId[]; // Список студентов в потоке
}

export type StreamDocument = Stream & Document;
export const StreamSchema = SchemaFactory.createForClass(Stream);
