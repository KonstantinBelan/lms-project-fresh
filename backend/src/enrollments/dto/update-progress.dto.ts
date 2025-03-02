import { IsString } from 'class-validator';

export class UpdateProgressDto {
  @IsString()
  moduleId: string;

  @IsString()
  lessonId: string;
}
