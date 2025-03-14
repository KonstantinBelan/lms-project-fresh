import { ApiProperty } from '@nestjs/swagger';

export class CourseAnalyticsDto {
  @ApiProperty({
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  courseId: string;

  @ApiProperty({
    description: 'Название курса',
    example: 'Основы программирования',
  })
  courseTitle: string;

  @ApiProperty({
    description: 'Общее количество студентов',
    example: 50,
  })
  totalStudents: number;

  @ApiProperty({
    description: 'Количество завершивших курс студентов',
    example: 45,
  })
  completedStudents: number;

  @ApiProperty({
    description: 'Процент завершения курса',
    example: 90,
  })
  completionRate: number;

  @ApiProperty({
    description: 'Средняя оценка по курсу',
    example: 4.5,
  })
  averageGrade: number;
}
