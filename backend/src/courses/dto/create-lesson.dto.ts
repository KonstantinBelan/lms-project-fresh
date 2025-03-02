import { IsString, IsOptional } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  media?: string;
}
