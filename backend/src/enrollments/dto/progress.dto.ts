import { ApiProperty } from '@nestjs/swagger';

// Класс для представления прогресса студента
export class StudentProgress {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор студента',
  })
  studentId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Идентификатор курса',
  })
  courseId: string;

  @ApiProperty({ example: 2, description: 'Количество завершенных модулей' })
  completedModules: number;

  @ApiProperty({ example: 3, description: 'Общее количество модулей' })
  totalModules: number;

  @ApiProperty({ example: 5, description: 'Количество завершенных уроков' })
  completedLessons: number;

  @ApiProperty({ example: 10, description: 'Общее количество уроков' })
  totalLessons: number;

  @ApiProperty({ example: 50, description: 'Процент завершения курса' })
  completionPercentage: number;

  @ApiProperty({ example: 100, description: 'Количество набранных баллов' })
  points: number;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439013'],
    isArray: true,
    description: 'Массив идентификаторов завершенных модулей',
  })
  completedModuleIds: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439014'],
    isArray: true,
    description: 'Массив идентификаторов завершенных уроков',
  })
  completedLessonIds: string[];

  @ApiProperty({
    example: 85.5,
    description: 'Средняя оценка за домашние задания',
  })
  avgHomeworkGrade: number;

  @ApiProperty({ example: 92.0, description: 'Средний балл за квизы' })
  avgQuizScore: number;
}
