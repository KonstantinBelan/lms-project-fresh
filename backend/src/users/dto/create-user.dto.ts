import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['admin', 'teacher', 'student'], {
    message: 'Role must be one of: admin, teacher, student',
  })
  role?: 'admin' | 'teacher' | 'student';
}
