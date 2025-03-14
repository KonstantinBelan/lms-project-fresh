import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Электронная почта пользователя',
    example: 'student@example.com',
    examples: {
      student: { value: 'student@example.com', description: 'Email студента' },
      teacher: {
        value: 'teacher@school.org',
        description: 'Email преподавателя',
      },
    },
  })
  @IsEmail({}, { message: 'Некорректный формат электронной почты' })
  email: string;

  @ApiProperty({
    description: 'Токен сброса пароля',
    example: 'abc123',
    examples: {
      shortToken: { value: 'abc123', description: 'Короткий токен' },
      longToken: { value: 'a1b2c3d4e5f6', description: 'Длинный токен' },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'Токен не может быть пустым' })
  token: string;

  @ApiProperty({
    description: 'Новый пароль',
    example: 'NewPassword123!',
    examples: {
      simple: { value: 'NewPassword123!', description: 'Простой пароль' },
      complex: { value: 'Str0ngP@ssw0rd!', description: 'Сложный пароль' },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  newPassword: string;
}
