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
import { ApiProperty } from '@nestjs/swagger';

export class QuizQuestionDto {
  @ApiProperty({ description: 'Question text', example: 'What is 1+1?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Answer options',
    required: false,
    example: ['1', '2', '3'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options?: string[];

  @ApiProperty({
    description: 'Correct answer indices',
    required: false,
    example: [1],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(999, { each: true })
  correctAnswers?: number[];

  @ApiProperty({
    description: 'Correct text answer',
    required: false,
    example: '2',
  })
  @IsOptional()
  @IsString()
  correctTextAnswer?: string;

  @ApiProperty({ description: 'Question weight', default: 1, example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number = 1;

  @ApiProperty({
    description: 'Hint for the question',
    required: false,
    example: 'Think simple',
  })
  @IsOptional()
  @IsString()
  hint?: string;
}

export class CreateQuizDto {
  @ApiProperty({
    description: 'Lesson ID',
    example: '67c848293c783d942cafb836',
  })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({ description: 'Quiz title', example: 'Math Basics' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'List of questions' })
  @IsArray()
  @IsNotEmpty()
  questions: QuizQuestionDto[];

  @ApiProperty({
    description: 'Time limit in minutes',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;
}
