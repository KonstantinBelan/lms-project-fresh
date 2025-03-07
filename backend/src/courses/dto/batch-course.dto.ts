import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CourseDto {
  @ApiProperty({
    example: 'Course 1',
    description: 'The title of the course',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'This is a description of Course 1',
    description: 'The description of the course',
  })
  @IsString()
  description: string;
}

export class BatchCourseDto {
  @ApiProperty({
    example: [
      { title: 'Course 1', description: 'Description for course 1' },
      { title: 'Course 2', description: 'Description for course 2' },
    ],
    description: 'Array of courses to be created',
  })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CourseDto)
  courses: CourseDto[];
}
