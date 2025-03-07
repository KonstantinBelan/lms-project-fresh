import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Introduction to Programming',
    description: 'The title of the course',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'This course provides an introduction to programming concepts.',
    description: 'The description of the course',
  })
  @IsString()
  description: string;
}
