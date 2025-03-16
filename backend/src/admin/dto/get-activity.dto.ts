import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';
import { Notification } from '../../notifications/schemas/notification.schema';
import { Type } from 'class-transformer';

// DTO для фильтрации активности по датам
export class GetActivityDto {
  @ApiProperty({
    description: 'Начальная дата для фильтрации активности (ISO 8601)',
    required: false,
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Конечная дата для фильтрации активности (ISO 8601)',
    required: false,
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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

// Интерфейс для типизации ответа с активностью
export interface IActivityResponse {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalNotifications: number;
  recentEnrollments: Enrollment[];
  recentNotifications: Notification[];
}
