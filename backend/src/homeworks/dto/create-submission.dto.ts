import {
  IsNotEmpty,
  IsMongoId,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateSubmissionDto {
  @IsNotEmpty()
  @IsMongoId()
  homeworkId: string;

  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @IsNotEmpty()
  @IsString()
  submissionContent: string;
}
