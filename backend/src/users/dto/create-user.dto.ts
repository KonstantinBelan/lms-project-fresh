import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  ArrayMinSize,
  ArrayUnique,
  MinLength,
} from 'class-validator';
import { Role } from '../../auth/roles.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Электронная почта пользователя',
  })
  @IsEmail(
    {},
    { message: 'email должен быть валидным адресом электронной почты' },
  )
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль пользователя (минимум 6 символов)',
  })
  @IsString({ message: 'password должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;

  @ApiProperty({
    example: 'Иван Иванов',
    description: 'Имя пользователя (необязательно)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'name должен быть строкой' })
  name?: string;

  @ApiProperty({
    description: 'Роли пользователя',
    enum: Role,
    isArray: true,
    example: [Role.STUDENT, Role.TEACHER],
    required: false,
    default: [Role.STUDENT],
  })
  @IsOptional()
  @IsEnum(Role, { each: true, message: 'Каждая роль должна быть валидной' })
  @ArrayMinSize(1, { message: 'Должен быть хотя бы одна роль' })
  @ArrayUnique({ message: 'Роли не должны повторяться' })
  roles?: Role[];
}
