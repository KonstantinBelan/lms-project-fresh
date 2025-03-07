import {
  IsNotEmpty,
  IsMongoId,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the homework',
  })
  @IsNotEmpty()
  @IsMongoId()
  homeworkId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the student',
  })
  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @ApiProperty({
    example: 'This is the submission content',
    description: 'The content of the submission',
  })
  @IsNotEmpty()
  @IsString()
  submissionContent: string;
}
