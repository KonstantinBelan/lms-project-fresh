import { PartialType } from '@nestjs/mapped-types';
import { CreateHomeworkDto } from './create-homework.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHomeworkDto extends PartialType(CreateHomeworkDto) {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the lesson',
    required: false,
  })
  lessonId?: string;

  @ApiProperty({
    example: 'This is a homework description',
    description: 'The description of the homework',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'theory',
    description: 'The category of the homework (theory, practice, or project)',
    required: false,
  })
  category?: string;

  @ApiProperty({
    example: '2025-03-15T00:00:00Z',
    description: 'The deadline of the homework',
    required: false,
  })
  deadline?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the homework is active',
    required: false,
  })
  isActive?: boolean;
}
