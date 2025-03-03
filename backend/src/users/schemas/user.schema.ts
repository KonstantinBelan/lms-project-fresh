import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../auth/roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false }) // Добавляем select: false, чтобы по умолчанию не возвращать пароль
  password: string;

  @Prop()
  name?: string;

  @Prop({ type: [String], enum: Object.values(Role), default: [Role.STUDENT] }) // Массив ролей
  roles: Role[];
}

export const UserSchema = SchemaFactory.createForClass(User);
