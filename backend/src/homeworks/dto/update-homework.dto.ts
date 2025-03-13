import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeworkDto, HomeworkCategory } from './create-homework.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHomeworkDto extends PartialType(CreateHomeworkDto) {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор урока для обновления',
    required: false,
  })
  lessonId?: string;

  @ApiProperty({
    example: 'Это обновлённое описание домашнего задания',
    description: 'Обновлённое описание домашнего задания',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: HomeworkCategory.THEORY,
    description:
      'Обновлённая категория домашнего задания (теория, практика или проект)',
    required: false,
    enum: HomeworkCategory,
  })
  category?: HomeworkCategory;

  @ApiProperty({
    example: '2025-03-15T00:00:00Z',
    description: 'Обновлённый крайний срок выполнения домашнего задания',
    required: false,
  })
  deadline?: string;

  @ApiProperty({
    example: true,
    description: 'Обновлённый статус активности домашнего задания',
    required: false,
    default: false,
  })
  isActive?: boolean;

  @ApiProperty({
    example: 15,
    description:
      'Обновлённые баллы за выполнение домашнего задания (от 0 до 100)',
    required: false,
  })
  points?: number;
}
