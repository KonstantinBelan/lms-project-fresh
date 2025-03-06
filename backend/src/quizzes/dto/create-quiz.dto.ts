import {
  IsString,
  IsArray,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class QuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(999) // Ограничим индекс разумным значением
  correctAnswer: number;
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
