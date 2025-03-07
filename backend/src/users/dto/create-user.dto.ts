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
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'User roles',
    enum: Role,
    isArray: true,
    example: [Role.STUDENT, Role.TEACHER],
    required: false,
    default: [Role.STUDENT],
    minItems: 1,
  })
  @IsOptional()
  @IsEnum(Role, { each: true })
  @ArrayMinSize(1)
  @ArrayUnique()
  roles?: Role[];
}
