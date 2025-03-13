import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Электронная почта пользователя',
    example: 'student@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Токен сброса пароля', example: 'abc123' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Новый пароль', example: 'NewPassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  newPassword: string;
}
