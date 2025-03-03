import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @IsNotEmpty()
  @IsMongoId()
  courseId: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
