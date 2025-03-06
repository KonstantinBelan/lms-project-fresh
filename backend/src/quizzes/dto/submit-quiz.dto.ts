import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  Validate,
} from 'class-validator';
import { ArrayOrStringValidator } from '../../validators/array-of-arrays.validator';

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @ArrayNotEmpty()
  @Validate(ArrayOrStringValidator)
  answers: (number[] | string)[];
}
