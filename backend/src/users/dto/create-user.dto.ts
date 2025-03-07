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
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
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
