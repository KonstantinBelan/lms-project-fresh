import { IsOptional, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  studentId?: string;

  @ApiProperty({
    description: 'Номер страницы (начиная с 1)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number) // Преобразует строку в число
  @IsInt({ message: 'page должен быть целым числом' })
  @Min(1, { message: 'page должен быть не меньше 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number) // Преобразует строку в число
  @IsInt({ message: 'limit должен быть целым числом' })
  @Min(1, { message: 'limit должен быть не меньше 1' })
  @Max(100, { message: 'limit не должен превышать 100' })
  limit?: number = 10;
}
