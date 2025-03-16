import { ApiProperty } from '@nestjs/swagger';

export class EnrollmentDto {
  @ApiProperty({
    description: 'ID зачисления',
    example: '507f1f77bcf86cd799439013',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439012',
    type: String,
  })
  studentId: string;

  @ApiProperty({
    description: 'Идентификатор курса',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  courseId: string;

  @ApiProperty({
    description: 'Идентификатор потока (опционально)',
    example: '507f1f77bcf86cd799439014',
    required: false,
    type: String,
  })
  streamId?: string;

  @ApiProperty({
    description: 'Список завершенных модулей',
    example: ['module1', 'module2'],
    type: [String],
    default: [],
  })
  completedModules: string[];

  @ApiProperty({
    description: 'Список завершенных уроков',
    example: ['lesson1', 'lesson2'],
    type: [String],
    default: [],
  })
  completedLessons: string[];

  @ApiProperty({
    description: 'Завершен ли курс',
    example: false,
    type: Boolean,
    default: false,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: 'Оценка за курс (опционально)',
    example: 85,
    required: false,
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  grade?: number;

  @ApiProperty({
    description: 'Дедлайн курса (опционально)',
    example: '2025-06-01T00:00:00Z',
    required: false,
    type: String,
  })
  deadline?: string;

  @ApiProperty({
    description: 'Количество набранных баллов',
    example: 150,
    type: Number,
    default: 0,
  })
  points: number;

  @ApiProperty({
    description: 'Идентификатор тарифа (опционально)',
    example: '507f1f77bcf86cd799439015',
    required: false,
    type: String,
  })
  tariffId?: string;

  @ApiProperty({
    description: 'Версия документа',
    example: 0,
    type: Number,
    default: 0,
  })
  __v: number;
}
