import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  Validate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayOrStringValidator } from '../../validators/array-of-arrays.validator';

export class SubmitQuizDto {
  @ApiProperty({
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Список ответов (индексы для множественного выбора или текст)',
    example: [[1], 'Париж'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Validate(ArrayOrStringValidator)
  answers: (number[] | string)[];
}
