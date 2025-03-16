import { ApiProperty } from '@nestjs/swagger';

export class EnrollmentResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор зачисления',
  })
  id: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Идентификатор студента',
  })
  studentId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439013',
    description: 'Идентификатор курса',
  })
  courseId: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439014'],
    description: 'Список завершенных модулей',
  })
  completedModules: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439015'],
    description: 'Список завершенных уроков',
  })
  completedLessons: string[];

  @ApiProperty({ example: false, description: 'Завершен ли курс' })
  isCompleted: boolean;

  @ApiProperty({
    example: 85,
    description: 'Оценка за курс (опционально)',
    required: false,
  })
  grade?: number;

  @ApiProperty({
    example: '2025-03-15T00:00:00Z',
    description: 'Дедлайн (опционально)',
    required: false,
  })
  deadline?: string;

  @ApiProperty({ example: 50, description: 'Количество баллов' })
  points: number;
}
