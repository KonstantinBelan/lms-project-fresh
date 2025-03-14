import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';

// DTO для обновления курса
export class UpdateCourseDto {
  @ApiProperty({
    example: 'Введение в программирование',
    description: 'Название курса',
    required: false,
    examples: {
      intro: { value: 'Введение в программирование' },
      advanced: { value: 'Продвинутое программирование на TypeScript' },
    },
  })
  @IsOptional()
  @IsString({ message: 'Название курса должно быть строкой' })
  title?: string;

  @ApiProperty({
    example: 'Этот курс знакомит с основами программирования.',
    description: 'Описание курса',
    required: false,
    examples: {
      short: { value: 'Краткое описание курса.' },
      detailed: { value: 'Подробное описание с примерами и целями курса.' },
    },
  })
  @IsOptional()
  @IsString({ message: 'Описание курса должно быть строкой' })
  description?: string;
}

// Интерфейс для UpdateCourseDto
export interface IUpdateCourseDto {
  title?: string;
  description?: string;
}
