import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiProperty({
    example: 'Введение в программирование',
    description: 'Название курса',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'Этот курс знакомит с основами программирования.',
    description: 'Описание курса',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
