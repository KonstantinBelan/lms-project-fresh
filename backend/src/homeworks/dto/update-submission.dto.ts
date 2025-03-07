import { PartialType } from '@nestjs/mapped-types';
import { CreateSubmissionDto } from './create-submission.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
  @ApiProperty({
    example: 'This is the teacher comment',
    description: 'The comment of the teacher',
    required: false,
  })
  @IsOptional()
  @IsString()
  teacherComment?: string;

  @ApiProperty({
    example: 85,
    description: 'The grade of the submission',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  grade?: number;

  @ApiProperty({
    example: true,
    description: 'Whether the submission is reviewed',
    required: false,
  })
  @IsOptional()
  isReviewed?: boolean;
}
