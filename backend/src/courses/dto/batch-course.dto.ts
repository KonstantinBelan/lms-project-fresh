import {
  IsNotEmpty,
  IsString,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CourseDto {
  @ApiProperty({
    example: 'Курс 1',
    description: 'Название курса',
  })
  @IsString()
  @IsNotEmpty({ message: 'Название курса не может быть пустым' })
  title: string;

  @ApiProperty({
    example: 'Это описание курса 1',
    description: 'Описание курса',
  })
  @IsString()
  @IsNotEmpty({ message: 'Описание курса не может быть пустым' })
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
