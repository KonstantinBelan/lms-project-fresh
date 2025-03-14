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

// DTO для вопроса викторины
export class QuizQuestionDto {
  @ApiProperty({
    description: 'Текст вопроса',
    example: 'Что такое 1+1?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Варианты ответа (для вопросов с множественным выбором)',
    required: false,
    example: ['1', '2', '3'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options?: string[];

  @ApiProperty({
    description: 'Индексы правильных ответов (для множественного выбора)',
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
    description: 'Правильный текстовый ответ (для открытых вопросов)',
    required: false,
    example: '2',
  })
  @IsOptional()
  @IsString()
  correctTextAnswer?: string;

  @ApiProperty({
    description: 'Вес вопроса (влияет на итоговую оценку)',
    example: 2,
    default: 1,
  })
  @IsInt()
  @Min(1)
  weight: number = 1; // Убрано @IsOptional, так как есть дефолтное значение

  @ApiProperty({
    description: 'Подсказка для вопроса',
    required: false,
    example: 'Подумай просто',
  })
  @IsOptional()
  @IsString()
  hint?: string;
}

// DTO для создания викторины
export class CreateQuizDto {
  @ApiProperty({
    description: 'Идентификатор урока, к которому привязана викторина',
    example: '67c848293c783d942cafb836',
  })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({
    description: 'Название викторины',
    example: 'Основы математики',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Список вопросов викторины',
    type: [QuizQuestionDto],
    example: [
      {
        question: 'Что такое 1+1?',
        options: ['1', '2', '3'],
        correctAnswers: [1],
        weight: 2,
        hint: 'Подумай просто',
      },
      {
        question: 'Назови столицу Франции',
        correctTextAnswer: 'Париж',
        weight: 1,
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  questions: QuizQuestionDto[];

  @ApiProperty({
    description: 'Ограничение времени в минутах',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;
}
