import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';
import { Notification } from '../../notifications/schemas/notification.schema';

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
