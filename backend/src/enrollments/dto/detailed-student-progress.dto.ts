import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';

/**
 * DTO для детального прогресса по курсу
 */
export class DetailedCourseProgress {
  @ApiProperty({
    description: 'Уникальный идентификатор курса',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsMongoId()
  courseId: string;

  @ApiProperty({
    description: 'Название курса',
    example: 'Основы программирования',
    type: String,
  })
  @IsString()
  courseTitle: string;

  @ApiProperty({
    description: 'Процент завершения модулей курса',
    example: 75.5,
    type: Number,
  })
  @IsNumber()
  completionPercentage: number;

  @ApiProperty({
    description: 'Процент завершения уроков курса',
    example: 80.0,
    type: Number,
  })
  @IsNumber()
  lessonCompletionPercentage: number;

  @ApiProperty({
    description: 'Количество завершенных модулей',
    example: 3,
    type: Number,
  })
  @IsNumber()
  completedModules: number;

  @ApiProperty({
    description: 'Общее количество модулей в курсе',
    example: 5,
    type: Number,
  })
  @IsNumber()
  totalModules: number;

  @ApiProperty({
    description: 'Количество завершенных уроков',
    example: 12,
    type: Number,
  })
  @IsNumber()
  completedLessons: number;

  @ApiProperty({
    description: 'Общее количество уроков в курсе',
    example: 15,
    type: Number,
  })
  @IsNumber()
  totalLessons: number;

  @ApiProperty({
    description: 'Количество набранных баллов за курс',
    example: 85,
    type: Number,
  })
  @IsNumber()
  points: number;

  @ApiProperty({
    description: 'Оценка за курс (если применимо)',
    example: 4.5,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  grade?: number;

  @ApiProperty({
    description: 'Флаг, указывающий, завершен ли курс',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  isCompleted: boolean;

  @ApiProperty({
    description: 'Дедлайн курса в формате ISO 8601',
    example: '2025-12-31T23:59:59.999Z',
    type: String,
  })
  @IsString()
  deadline: string;
}

/**
 * DTO для детального прогресса студента
 */
export class DetailedStudentProgress {
  @ApiProperty({
    description: 'Уникальный идентификатор студента',
    example: '507f191e810c19729de860ea',
    type: String,
  })
  @IsMongoId()
  studentId: string;

  @ApiProperty({
    description: 'Массив прогресса студента по всем курсам',
    type: [DetailedCourseProgress],
  })
  @IsArray()
  progress: DetailedCourseProgress[];
}
