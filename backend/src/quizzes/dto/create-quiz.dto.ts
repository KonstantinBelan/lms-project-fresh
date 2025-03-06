import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class QuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(999, { each: true })
  correctAnswers?: number[];

  @IsOptional()
  @IsString()
  correctTextAnswer?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number = 1;

  @IsOptional()
  @IsString()
  hint?: string;
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

  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;
}
