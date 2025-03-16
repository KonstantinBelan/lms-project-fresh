import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../../courses/schemas/course.schema';

export class CourseResponseDto {
  @ApiProperty({ description: 'Список курсов', type: [Course] })
  data: Course[];

  @ApiProperty({ description: 'Общее количество курсов', example: 20 })
  total: number;

  @ApiProperty({ description: 'Текущая страница', example: 1 })
  page: number;

  @ApiProperty({ description: 'Лимит на странице', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц', example: 2 })
  totalPages: number;
}
