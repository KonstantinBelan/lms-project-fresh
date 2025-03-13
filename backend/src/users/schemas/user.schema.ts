import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../auth/roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false }) // Пароль не возвращается по умолчанию
  password: string;

  @Prop({ type: String, required: false })
  name?: string;

  @Prop({
    type: [String],
    enum: Object.values(Role),
    default: [Role.STUDENT],
  })
  roles: Role[];

  @Prop({ type: String, required: false })
  phone?: string;

  @Prop({ type: String, required: false })
  avatar?: string;

  @Prop({ type: String, required: false })
  telegramId?: string;

  @Prop({
    type: {
      notifications: Boolean,
      language: String,
      resetToken: String,
      resetTokenExpires: Number,
    },
    default: {
      notifications: true,
      language: 'en',
      resetToken: undefined,
      resetTokenExpires: undefined,
    },
  })
  settings?: {
    notifications: boolean;
    language: string;
    resetToken?: string;
    resetTokenExpires?: number;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Group' }] })
  groups?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ roles: 1 }); // Индекс для быстрого поиска по ролям
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
