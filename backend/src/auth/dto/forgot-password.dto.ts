import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Электронная почта пользователя',
    example: 'student@example.com',
  })
  @IsEmail()
  email: string;
}
