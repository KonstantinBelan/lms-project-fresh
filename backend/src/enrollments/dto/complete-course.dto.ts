import { IsNumber, Min, Max } from 'class-validator';

export class CompleteCourseDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;
}
