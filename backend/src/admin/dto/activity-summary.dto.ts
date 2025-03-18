import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';
import { Notification } from '../../notifications/schemas/notification.schema';
import { EnrollmentResponseDto } from '../../enrollments/dto/enrollment-response.dto';
import { NotificationResponseDto } from '../../notifications/dto/notification-response.dto';

class PaginatedList<T> {
  @ApiProperty({ description: 'Список данных' })
  data: T[];

  @ApiProperty({ description: 'Общее количество записей', example: 50 })
  total: number;

  @ApiProperty({ description: 'Текущая страница', example: 1 })
  page: number;

  @ApiProperty({ description: 'Лимит записей на странице', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц', example: 5 })
  totalPages: number;
}

export class ActivitySummaryDto {
  @ApiProperty({ description: 'Общее количество пользователей', example: 100 })
  totalUsers: number;

  @ApiProperty({ description: 'Общее количество курсов', example: 20 })
  totalCourses: number;

  @ApiProperty({
    description: 'Общее количество записей о зачислении',
    example: 50,
  })
  totalEnrollments: number;

  @ApiProperty({ description: 'Общее количество уведомлений', example: 200 })
  totalNotifications: number;

  @ApiProperty({
    description: 'Список последних записей о зачислении',
    type: () => PaginatedList,
  })
  recentEnrollments: PaginatedList<EnrollmentResponseDto>;

  @ApiProperty({
    description: 'Список последних уведомлений',
    type: () => PaginatedList,
  })
  recentNotifications: PaginatedList<NotificationResponseDto>;
}
