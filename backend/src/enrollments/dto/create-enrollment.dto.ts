import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the student',
  })
  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the course',
  })
  @IsNotEmpty()
  @IsMongoId()
  courseId: string;

  streamIds?: string;

  @ApiProperty({
    example: '2023-12-31T23:59:59.999Z',
    description: 'The optional deadline for the enrollment',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
