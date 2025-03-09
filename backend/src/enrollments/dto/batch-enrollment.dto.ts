import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsDateString,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Array of student IDs',
  })
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  @IsMongoId({ each: true })
  studentIds: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    description: 'Array of course IDs',
  })
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  @IsMongoId({ each: true })
  courseIds: string[];

  streamIds?: string[];

  @ApiProperty({
    example: ['2025-12-31T23:59:59.999Z', '2025-12-31T23:59:59.999Z'],
    description: 'Optional array of deadlines for the enrollments',
    required: false,
  })
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
