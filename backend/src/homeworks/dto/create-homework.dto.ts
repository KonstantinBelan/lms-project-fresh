import {
  IsNotEmpty,
  IsMongoId,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidationOptions,
} from 'class-validator';
import { Role } from '../../auth/roles.enum';

export class CreateHomeworkDto {
  @IsNotEmpty()
  @IsMongoId()
  lessonId: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(['theory', 'practice', 'project'], {
    message: 'Category must be theory, practice, or project',
  })
  category?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Deadline must be a valid ISO date string (e.g., "2025-03-15T00:00:00Z")',
    },
  )
  deadline?: string;

  @IsOptional()
  isActive?: boolean;
}
