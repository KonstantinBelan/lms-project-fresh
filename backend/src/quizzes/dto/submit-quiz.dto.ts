import {
  IsString,
  IsArray,
  IsNotEmpty,
  ArrayNotEmpty,
  Validate,
} from 'class-validator';
import { ArrayOfArraysOfIntegers } from '../../validators/array-of-arrays.validator';

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @ArrayNotEmpty()
  @Validate(ArrayOfArraysOfIntegers)
  answers: number[][];
}
