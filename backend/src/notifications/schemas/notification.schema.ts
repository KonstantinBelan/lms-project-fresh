import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string; // Ссылка на пользователя (студента)

  @Prop({ required: true })
  message: string; // Текст уведомления

  @Prop({ type: Boolean, default: false })
  isRead: boolean; // Прочитано ли уведомление

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
