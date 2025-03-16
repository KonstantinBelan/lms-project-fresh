import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';

export class EnrollmentResponseDto {
  @ApiProperty({
    type: [Enrollment],
    description: 'Массив записей о зачислении',
  })
  data: Enrollment[];

  @ApiProperty({
    type: Number,
    example: 50,
    description: 'Общее количество записей',
  })
  total: number;

  @ApiProperty({ type: Number, example: 1, description: 'Текущая страница' })
  page: number;

  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Лимит записей на страницу',
  })
  limit: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Общее количество страниц',
  })
  totalPages: number;
}
