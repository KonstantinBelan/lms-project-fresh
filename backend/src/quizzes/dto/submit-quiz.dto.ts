import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsInt,
  ArrayNotEmpty,
} from 'class-validator';

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true }) // Применяем IsInt к каждому элементу вложенных массивов
  answers: number[][];
}
