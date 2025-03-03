import { PartialType } from '@nestjs/mapped-types';
import { CreateSubmissionDto } from './create-submission.dto';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
  @IsOptional()
  @IsString()
  teacherComment?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  grade?: number;

  @IsOptional()
  isReviewed?: boolean;
}
