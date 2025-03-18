import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '../schemas/enrollment.schema';

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
    description: 'Идентификатор потока (опционально)',
    example: '507f1f77bcf86cd799439014',
    required: false,
  })
  streamId?: string;

  @ApiProperty({
    description: 'Идентификатор тарифа (опционально)',
    example: '507f1f77bcf86cd799439015',
    required: false,
  })
  tariffId?: string;

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

  constructor(enrollment: Enrollment) {
    // this._id = enrollment._id.toString();
    this.studentId = enrollment.studentId.toString();
    this.courseId = enrollment.courseId.toString();
    this.streamId = enrollment.streamId?.toString();
    this.completedModules = enrollment.completedModules.map((id) =>
      id.toString(),
    );
    this.completedLessons = enrollment.completedLessons.map((id) =>
      id.toString(),
    );
    this.isCompleted = enrollment.isCompleted;
    this.grade = enrollment.grade;
    this.deadline = enrollment.deadline?.toISOString();
    this.points = enrollment.points;
    this.tariffId = enrollment.tariffId?.toString();
  }
}
