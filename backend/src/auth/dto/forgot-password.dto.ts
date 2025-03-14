import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Электронная почта пользователя для сброса пароля',
    example: 'student@example.com',
    examples: {
      validEmail: {
        value: 'student@example.com',
        description: 'Корректный email',
      },
      anotherValidEmail: {
        value: 'teacher@school.org',
        description: 'Другой корректный email',
      },
    },
  })
  @IsEmail({}, { message: 'Некорректный формат электронной почты' })
  email: string;
}
