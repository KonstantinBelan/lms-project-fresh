import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsInt,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerArrayDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  answers: number[];
}

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AnswerArrayDto)
  answers: AnswerArrayDto[];
}
