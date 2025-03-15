import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeworkDto, HomeworkCategory } from './create-homework.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsMongoId,
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

// Интерфейс для DTO обновления домашнего задания
export interface IUpdateHomeworkDto {
  lessonId?: string;
  description?: string;
  category?: HomeworkCategory;
  deadline?: string;
  isActive?: boolean;
  points?: number;
}

export class UpdateHomeworkDto extends PartialType(CreateHomeworkDto) {
  @ApiProperty({
    description: 'Идентификатор урока для обновления',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId({
    message: 'Идентификатор урока должен быть валидным MongoDB ObjectId',
  })
  lessonId?: string;

  @ApiProperty({
    description: 'Обновлённое описание домашнего задания',
    examples: [
      'Обновлённое описание: написать тесты для API',
      'Рефакторинг кода сервиса',
    ],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  description?: string;

  @ApiProperty({
    description: 'Обновлённая категория домашнего задания',
    enum: HomeworkCategory,
    examples: [HomeworkCategory.PROJECT, HomeworkCategory.THEORY],
    required: false,
  })
  @IsOptional()
  @IsEnum(HomeworkCategory, {
    message: 'Категория должна быть одной из: theory, practice, project',
  })
  category?: HomeworkCategory;

  @ApiProperty({
    description: 'Обновлённый крайний срок выполнения в формате ISO',
    example: '2025-03-25T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Крайний срок должен быть валидной датой в формате ISO' },
  )
  deadline?: string;

  @ApiProperty({
    description: 'Обновлённый статус активности',
    examples: [true, false],
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Статус активности должен быть булевым значением' })
  isActive?: boolean;

  @ApiProperty({
    description: 'Обновлённые баллы за выполнение (от 0 до 100)',
    examples: [25, 50, 75],
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Баллы должны быть числом' })
  @Min(0, { message: 'Баллы не могут быть меньше 0' })
  @Max(100, { message: 'Баллы не могут превышать 100' })
  points?: number;
}
