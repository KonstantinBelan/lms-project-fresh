import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsDateString,
  ArrayNotEmpty,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DateStringDto {
  @IsDateString(
    {},
    {
      message:
        'Date must be a valid ISO date string (e.g., "2025-03-15T00:00:00Z")',
    },
  )
  date: string;
}

export class BatchEnrollmentDto {
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  @IsMongoId({ each: true })
  studentIds: string[];

  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  @IsMongoId({ each: true })
  courseIds: string[];

  @IsOptional()
  @IsDateString(
    {},
    {
      each: true,
      message:
        'Each deadline must be a valid ISO date string (e.g., "2025-03-15T00:00:00Z")',
    },
  )
  deadlines?: string[];
}
