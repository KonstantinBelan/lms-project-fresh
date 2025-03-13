import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GroupDocument = Group & Document;

@Schema()
export class Group {
  @Prop({ required: true })
  name: string; // Название группы

  @Prop({})
  description?: string; // Описание группы (опционально)

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  students: Types.ObjectId[]; // Список студентов в группе
}

export const GroupSchema = SchemaFactory.createForClass(Group);
GroupSchema.index({ name: 1 }); // Индекс для быстрого поиска по названию
