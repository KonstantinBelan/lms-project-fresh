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
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true }); // Явно создаём уникальный индекс для email
UserSchema.index({ roles: 1 }); // Индекс для roles
UserSchema.index({ name: 1 }); // Индекс для name (опционально)
