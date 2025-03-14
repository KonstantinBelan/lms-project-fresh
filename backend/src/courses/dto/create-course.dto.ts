import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Введение в программирование',
    description: 'Название курса',
    examples: {
      beginner: { value: 'Введение в программирование' },
      advanced: { value: 'Продвинутое программирование на TypeScript' },
    },
  })
  @IsString({ message: 'Название курса должно быть строкой' })
  @IsNotEmpty({ message: 'Название курса не может быть пустым' })
  title: string;

  @ApiProperty({
    example: 'Этот курс знакомит с основами программирования.',
    description: 'Описание курса',
    examples: {
      short: { value: 'Краткое описание курса.' },
      detailed: { value: 'Подробное описание с примерами и целями курса.' },
    },
  })
  @IsString({ message: 'Описание курса должно быть строкой' })
  @IsNotEmpty({ message: 'Описание курса не может быть пустым' })
  description: string;
}

export interface ICreateCourseDto {
  title: string;
  description: string;
}
