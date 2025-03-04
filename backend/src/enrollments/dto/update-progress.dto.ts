import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateProgressDto {
  @IsMongoId()
  @IsNotEmpty()
  moduleId: string;

  @IsMongoId()
  @IsNotEmpty()
  lessonId: string;
}
