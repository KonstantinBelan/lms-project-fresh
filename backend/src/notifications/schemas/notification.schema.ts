// src/notifications/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: String, required: true })
  title: string; // Заголовок уведомления для админ-панели

  @Prop({ required: true })
  message: string; // Сообщение уведомления

  @Prop({ type: String, unique: true }) // Уникальный ключ для шаблона (опционально)
  key?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId; // Идентификатор одного получателя (опционально)

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  recipients: Types.ObjectId[]; // Массив идентификаторов получателей для массовых уведомлений

  @Prop({ type: Boolean, default: false })
  isRead: boolean; // Прочитано ли уведомление

  @Prop({ type: Boolean, default: false })
  isSent: boolean; // Отправлено ли уведомление

  @Prop({ type: Date })
  sentAt?: Date; // Дата и время отправки
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
