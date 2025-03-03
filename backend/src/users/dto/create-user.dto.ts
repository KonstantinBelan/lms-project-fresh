import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  ArrayMinSize,
  ArrayUnique,
} from 'class-validator';
import { Role } from '../../auth/roles.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(Role, { each: true })
  @ArrayMinSize(1)
  @ArrayUnique()
  roles?: Role[];
}
