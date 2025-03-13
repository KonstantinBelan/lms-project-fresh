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
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль пользователя (минимум 6 символов)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Иван Иванов',
    description: 'Имя пользователя',
    required: false,
  })
  @IsOptional()
  @IsString()
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
  @IsEnum(Role, { each: true })
  @ArrayMinSize(1)
  @ArrayUnique()
  roles?: Role[];
}
