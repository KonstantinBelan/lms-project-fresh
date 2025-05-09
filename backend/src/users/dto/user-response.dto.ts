import { ApiProperty } from '@nestjs/swagger';
import { UserSettingsDto } from './user-settings.dto';
import { User } from '../schemas/user.schema';

// DTO для ответа с данными пользователя
export class UserResponseDto {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Электронная почта пользователя',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван Иванов',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Роли пользователя',
    example: ['STUDENT'],
    isArray: true,
  })
  roles: string[];

  @ApiProperty({
    description: 'Номер телефона пользователя',
    example: '+79991234567',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Ссылка на аватар пользователя',
    example: 'http://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: 'ID чата Telegram',
    example: '123456789',
    required: false,
  })
  telegramId?: string;

  @ApiProperty({
    description: 'Настройки пользователя',
    type: UserSettingsDto,
    required: false,
  })
  settings?: UserSettingsDto;

  @ApiProperty({
    description: 'Список ID групп пользователя',
    example: ['507f1f77bcf86cd799439012'],
    required: false,
    isArray: true,
  })
  groups?: string[];

  constructor(user: User) {
    this._id = user._id.toString();
    this.email = user.email;
    this.name = user.name;
    this.roles = user.roles;
    this.phone = user.phone;
    this.avatar = user.avatar;
    this.telegramId = user.telegramId;
    this.settings = user.settings;
    this.groups = user.groups?.map((group) => group.toString());
  }
}
