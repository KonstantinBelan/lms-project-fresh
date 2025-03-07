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
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'List of answers',
    example: [['option1', 'option2'], 'text answer'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Validate(ArrayOrStringValidator)
  answers: (number[] | string)[];
}
