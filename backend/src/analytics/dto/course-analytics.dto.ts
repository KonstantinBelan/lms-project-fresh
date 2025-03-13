import { ApiProperty } from '@nestjs/swagger';

export class CourseAnalyticsDto {
  @ApiProperty({ description: 'ID курса' })
  courseId: string;

  @ApiProperty({ description: 'Название курса' })
  courseTitle: string;

  @ApiProperty({ description: 'Общее количество студентов' })
  totalStudents: number;

  @ApiProperty({ description: 'Количество завершивших курс студентов' })
  completedStudents: number;

  @ApiProperty({ description: 'Процент завершения курса' })
  completionRate: number;

  @ApiProperty({ description: 'Средняя оценка по курсу' })
  averageGrade: number;
}
