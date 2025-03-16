import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';
import { Notification } from '../../notifications/schemas/notification.schema';

export class ActivitySummaryDto {
  @ApiProperty({
    description: 'Общее количество пользователей',
    example: 100,
    type: Number,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Общее количество курсов',
    example: 20,
    type: Number,
  })
  totalCourses: number;

  @ApiProperty({
    description: 'Общее количество записей о зачислении',
    example: 50,
    type: Number,
  })
  totalEnrollments: number;

  @ApiProperty({
    description: 'Общее количество уведомлений',
    example: 200,
    type: Number,
  })
  totalNotifications: number;

  @ApiProperty({
    description: 'Список последних записей о зачислении',
    type: [Enrollment],
  })
  recentEnrollments: Enrollment[];

  @ApiProperty({
    description: 'Список последних уведомлений',
    type: [Notification],
  })
  recentNotifications: Notification[];
}
