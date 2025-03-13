import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Электронная почта пользователя',
    example: 'student@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Пароль пользователя', example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  password: string;
}
