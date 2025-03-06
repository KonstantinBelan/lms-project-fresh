import { IsString, IsArray, IsNotEmpty, IsInt } from 'class-validator';

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsArray()
  @IsInt({ each: true })
  answers: number[];
}
