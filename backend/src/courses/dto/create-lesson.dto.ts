import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({
    example: 'Lesson 1',
    description: 'The title of the lesson',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'This is the content of Lesson 1',
    description: 'The content of the lesson',
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: 'http://example.com/media',
    description: 'Optional media URL for the lesson',
    required: false,
  })
  @IsOptional()
  @IsString()
  media?: string;
}
