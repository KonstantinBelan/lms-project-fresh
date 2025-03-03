import { PartialType } from 'class-transformer';
import { CreateSubmissionDto } from './create-submission.dto';

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
