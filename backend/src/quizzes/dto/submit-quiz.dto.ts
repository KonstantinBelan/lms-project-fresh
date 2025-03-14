import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  Validate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayOrStringValidator } from '../../validators/array-of-arrays.validator';

// DTO для отправки ответов на викторину
export class SubmitQuizDto {
  @ApiProperty({
    description: 'Идентификатор студента, отправляющего викторину',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Список ответов студента (индексы или текст)',
    example: [[1], 'Париж'],
    examples: {
      multipleChoice: { value: [[0, 1], [2]] },
      textAnswer: { value: ['42', 'Париж'] },
      mixed: { value: [[1], 'Да'] },
    },
  })
  @IsArray()
  @ArrayNotEmpty()
  @Validate(ArrayOrStringValidator)
  answers: (number[] | string)[];
}
