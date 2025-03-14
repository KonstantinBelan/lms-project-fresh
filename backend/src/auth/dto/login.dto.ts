import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
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
    description: 'Пароль пользователя',
    example: 'Password123!',
    examples: {
      simple: { value: 'Password123!', description: 'Простой пароль' },
      complex: { value: 'Str0ngP@ssw0rd!', description: 'Сложный пароль' },
    },
  })
  @IsString()
  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  password: string;
}
