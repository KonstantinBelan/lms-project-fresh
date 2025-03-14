import {
  IsNotEmpty,
  IsString,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CourseDto {
  @ApiProperty({
    example: 'Курс 1',
    description: 'Название курса',
    examples: {
      basic: { value: 'Курс 1' },
      detailed: { value: 'Курс 2: Основы Nest.js' },
    },
  })
  @IsString({ message: 'Название курса должно быть строкой' })
  @IsNotEmpty({ message: 'Название курса не может быть пустым' })
  title: string;

  @ApiProperty({
    example: 'Это описание курса 1',
    description: 'Описание курса',
    examples: {
      short: { value: 'Краткое описание.' },
      long: { value: 'Подробное описание курса с целями.' },
    },
  })
  @IsString({ message: 'Описание курса должно быть строкой' })
  @IsNotEmpty({ message: 'Описание курса не может быть пустым' })
  description: string;
}

export interface ICourseDto {
  title: string;
  description: string;
}

export class BatchCourseDto {
  @ApiProperty({
    example: [
      { title: 'Курс 1', description: 'Описание курса 1' },
      { title: 'Курс 2', description: 'Описание курса 2' },
    ],
    description: 'Массив курсов для создания',
  })
  @ArrayNotEmpty({ message: 'Массив курсов не может быть пустым' })
  @ValidateNested({ each: true })
  @Type(() => CourseDto)
  courses: CourseDto[];
}
