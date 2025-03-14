import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../auth/roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string; // Электронная почта пользователя

  @Prop({ required: true, select: false })
  password: string; // Пароль (не возвращается по умолчанию)

  @Prop({ type: String, required: false })
  name?: string; // Имя пользователя

  @Prop({
    type: [String],
    enum: Object.values(Role),
    default: [Role.STUDENT],
  })
  roles: Role[]; // Роли пользователя

  @Prop({ type: String, required: false })
  phone?: string; // Телефон пользователя

  @Prop({ type: String, required: false })
  avatar?: string; // Аватар пользователя

  @Prop({ type: String, required: false })
  telegramId?: string; // ID Telegram чата

  @Prop({
    type: {
      notifications: Boolean,
      language: String,
      resetToken: String,
      resetTokenExpires: Number,
    },
    default: {
      notifications: true,
      language: 'ru', // Изменил на русский по умолчанию
      resetToken: undefined,
      resetTokenExpires: undefined,
    },
  })
  settings?: {
    notifications: boolean; // Включены ли уведомления
    language: string; // Язык интерфейса
    resetToken?: string; // Токен сброса пароля
    resetTokenExpires?: number; // Время истечения токена
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Group' }] })
  groups?: Types.ObjectId[]; // Список групп пользователя
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ roles: 1 }); // Индекс для поиска по ролям
UserSchema.index({ name: 1 }); // Индекс для поиска по имени

export interface User {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name?: string;
  roles: Role[];
  phone?: string;
  avatar?: string;
  telegramId?: string;
  settings?: {
    notifications: boolean;
    language: string;
    resetToken?: string;
    resetTokenExpires?: number;
  };
  groups?: Types.ObjectId[];
}
