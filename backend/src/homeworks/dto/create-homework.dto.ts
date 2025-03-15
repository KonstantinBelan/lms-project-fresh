import {
  IsNotEmpty,
  IsMongoId,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Перечисление категорий домашнего задания
export enum HomeworkCategory {
  THEORY = 'theory',
  PRACTICE = 'practice',
  PROJECT = 'project',
}

export class CreateHomeworkDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор урока, к которому привязано домашнее задание',
  })
  @IsNotEmpty({ message: 'Идентификатор урока не может быть пустым' })
  @IsMongoId({
    message: 'Идентификатор урока должен быть валидным MongoDB ObjectId',
  })
  lessonId: string;

  @ApiProperty({
    example: 'Написать эссе о применении Nest.js в разработке',
    description: 'Описание домашнего задания',
  })
  @IsNotEmpty({ message: 'Описание не может быть пустым' })
  @IsString({ message: 'Описание должно быть строкой' })
  description: string;

  @ApiProperty({
    example: HomeworkCategory.PRACTICE,
    description: 'Категория домашнего задания: теория, практика или проект',
    enum: HomeworkCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(HomeworkCategory, {
    message: 'Категория должна быть одной из: theory, practice, project',
  })
  category?: HomeworkCategory;

  @ApiProperty({
    example: '2025-03-20T23:59:59Z',
    description: 'Крайний срок выполнения в формате ISO',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Крайний срок должен быть валидной датой в формате ISO',
    },
  )
  deadline?: string;

  @ApiProperty({
    example: true,
    description: 'Статус активности домашнего задания',
    required: false,
    default: false,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 20,
    description: 'Баллы за выполнение (от 0 до 100)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Баллы должны быть числом' })
  @Min(0, { message: 'Баллы не могут быть меньше 0' })
  @Max(100, { message: 'Баллы не могут превышать 100' })
  points?: number;
}
