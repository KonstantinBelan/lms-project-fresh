import { ApiProperty } from '@nestjs/swagger';

export class OverallAnalyticsDto {
  @ApiProperty({ description: 'Общее количество студентов' })
  totalStudents: number;

  @ApiProperty({ description: 'Количество завершивших курс студентов' })
  completedStudents: number;

  @ApiProperty({ description: 'Процент завершения курсов' })
  completionRate: number;

  @ApiProperty({ description: 'Средняя оценка по всем курсам' })
  averageGrade: number;

  @ApiProperty({ description: 'Общее количество курсов' })
  totalCourses: number;
}
