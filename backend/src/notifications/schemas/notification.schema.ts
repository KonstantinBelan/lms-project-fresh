// src/notifications/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: String, required: true })
  title: string; // Заголовок для админ-панели

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, unique: true }) // Уникальный ключ для шаблона
  key?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId; // Один получатель (опционально)

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  recipients: Types.ObjectId[]; // Массив получателей для массовых уведомлений

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Boolean, default: false })
  isSent: boolean; // Отправлено ли

  @Prop({ type: Date })
  sentAt?: Date; // Когда отправлено
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
