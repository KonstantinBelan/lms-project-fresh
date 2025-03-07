import {
  IsNotEmpty,
  IsMongoId,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidationOptions,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../auth/roles.enum';

export class CreateHomeworkDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the lesson',
  })
  @IsNotEmpty()
  @IsMongoId()
  lessonId: string;

  @ApiProperty({
    example: 'This is a homework description',
    description: 'The description of the homework',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 'theory',
    description: 'The category of the homework (theory, practice, or project)',
    required: false,
  })
  @IsOptional()
  @IsEnum(['theory', 'practice', 'project'], {
    message: 'Category must be theory, practice, or project',
  })
  category?: string;

  @ApiProperty({
    example: '2025-03-15T00:00:00Z',
    description: 'The deadline of the homework',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Deadline must be a valid ISO date string (e.g., "2025-03-15T00:00:00Z")',
    },
  )
  deadline?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the homework is active',
    required: false,
  })
  @IsOptional()
  isActive?: boolean;
}
