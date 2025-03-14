import { ApiProperty } from '@nestjs/swagger';

export class OverallAnalyticsDto {
  @ApiProperty({
    description: 'Общее количество студентов',
    example: 1000,
  })
  totalStudents: number;

  @ApiProperty({
    description: 'Количество завершивших курс студентов',
    example: 800,
  })
  completedStudents: number;

  @ApiProperty({
    description: 'Процент завершения курсов',
    example: 80,
  })
  completionRate: number;

  @ApiProperty({
    description: 'Средняя оценка по всем курсам',
    example: 4.2,
  })
  averageGrade: number;

  @ApiProperty({
    description: 'Общее количество курсов',
    example: 50,
  })
  totalCourses: number;
}
