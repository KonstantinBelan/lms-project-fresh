import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../auth/roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false }) // Добавляем select: false, чтобы по умолчанию не возвращать пароль
  password: string;

  @Prop({})
  name?: string;

  @Prop({
    type: [String],
    enum: Object.values(Role),
    default: [Role.STUDENT],
  }) // Индекс для roles
  roles: Role[];

  @Prop() // Добавляем поле phone (опционально, может быть null)
  phone?: string;

  @Prop({})
  avatar?: string;

  @Prop({
    type: { notifications: Boolean, language: String, resetToken: String },
    default: { notifications: true, language: 'en', resetToken: undefined },
  })
  settings?: { notifications: boolean; language: string; resetToken?: string }; // resetToken опционально

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Group' }] })
  groups?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ roles: 1 }); // Индекс для roles
UserSchema.index({ name: 1 }); // Индекс для name (опционально)

export interface User {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name?: string;
  roles: Role[];
  phone?: string;
  avatar?: string;
  settings?: { notifications: boolean; language: string; resetToken?: string };
  groups?: Types.ObjectId[];
}
