import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiProperty({
    example: 'Introduction to Programming',
    description: 'The title of the course',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'This course provides an introduction to programming concepts.',
    description: 'The description of the course',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
