import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LessonDocument = Lesson & Document;

@Schema()
export class Lesson {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string; // Текст, HTML, или ссылка на файл

  @Prop({ type: String, default: null }) // Опциональное поле для мультимедиа
  media?: string;

  _id: Types.ObjectId;

  __v: number;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
