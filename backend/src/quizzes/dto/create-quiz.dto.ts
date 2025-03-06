import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class QuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options: string[];

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(999, { each: true })
  correctAnswers: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number = 1;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsNotEmpty()
  questions: QuizQuestionDto[];
}
