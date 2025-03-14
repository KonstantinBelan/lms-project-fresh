import { IsOptional, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';
// DTO для фильтрации записей о зачислении с пагинацией
export class GetEnrollmentsDto {
  @ApiProperty({
    description: 'ID курса для фильтрации записей',
    required: false,
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @ApiProperty({
    description: 'ID пользователя для фильтрации записей',
    required: false,
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiProperty({
    description: 'Номер страницы (начиная с 1)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// Интерфейс для типизации ответа с записями о зачислении
export interface IEnrollmentResponse {
  data: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
