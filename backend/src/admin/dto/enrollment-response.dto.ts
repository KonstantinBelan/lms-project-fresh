import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentDto } from '../../enrollments/dto/enrollment.dto';

export class EnrollmentResponseDto {
  @ApiProperty({
    type: [EnrollmentDto],
    description: 'Массив записей о зачислении',
  })
  data: EnrollmentDto[];

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
