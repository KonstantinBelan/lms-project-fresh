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

// Определяем перечисление для категорий домашнего задания
export enum HomeworkCategory {
  THEORY = 'theory',
  PRACTICE = 'practice',
  PROJECT = 'project',
}

export class CreateHomeworkDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор урока',
  })
  @IsNotEmpty({ message: 'Идентификатор урока не может быть пустым' })
  @IsMongoId({
    message: 'Идентификатор урока должен быть валидным MongoDB ObjectId',
  })
  lessonId: string;

  @ApiProperty({
    example: 'Это описание домашнего задания',
    description: 'Описание домашнего задания',
  })
  @IsNotEmpty({ message: 'Описание не может быть пустым' })
  @IsString({ message: 'Описание должно быть строкой' })
  description: string;

  @ApiProperty({
    example: HomeworkCategory.THEORY,
    description: 'Категория домашнего задания (теория, практика или проект)',
    required: false,
    enum: HomeworkCategory,
  })
  @IsOptional()
  @IsEnum(HomeworkCategory, {
    message: 'Категория должна быть одной из: theory, practice, project',
  })
  category?: HomeworkCategory;

  @ApiProperty({
    example: '2025-03-15T00:00:00Z',
    description: 'Крайний срок выполнения домашнего задания',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Крайний срок должен быть валидной строкой даты в формате ISO (например, "2025-03-15T00:00:00Z")',
    },
  )
  deadline?: string;

  @ApiProperty({
    example: true,
    description: 'Активно ли домашнее задание',
    required: false,
    default: false,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 10,
    description: 'Баллы за выполнение домашнего задания (от 0 до 100)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Баллы должны быть числом' })
  @Min(0, { message: 'Баллы не могут быть меньше 0' })
  @Max(100, { message: 'Баллы не могут превышать 100' })
  points?: number;
}
