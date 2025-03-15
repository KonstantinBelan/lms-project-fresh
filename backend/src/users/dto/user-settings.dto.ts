import { ApiProperty } from '@nestjs/swagger';

// DTO для настроек пользователя
export class UserSettingsDto {
  @ApiProperty({
    description: 'Включены ли уведомления',
    example: true,
  })
  notifications: boolean;

  @ApiProperty({
    description: 'Язык интерфейса',
    example: 'ru',
  })
  language: string;

  @ApiProperty({
    description: 'Токен сброса пароля',
    example: 'abc123',
    required: false,
  })
  resetToken?: string;

  @ApiProperty({
    description: 'Время истечения токена сброса (в миллисекундах)',
    example: 1698765432100,
    required: false,
  })
  resetTokenExpires?: number;
}
