import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ArrayNotEmpty,
} from 'class-validator';

export class BatchCourseDto {
  @ArrayNotEmpty()
  courses: {
    title: string;
    description: string;
  }[];
}
