import { IsString, IsArray, IsNotEmpty, IsInt } from 'class-validator';

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @IsArray({ each: true })
  @IsInt({ each: true })
  answers: number[][];
}
