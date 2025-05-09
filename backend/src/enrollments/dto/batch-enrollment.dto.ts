import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsDateString,
  ArrayNotEmpty,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO для массового зачисления студентов на курсы
export class BatchEnrollmentDto {
  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description: 'Массив идентификаторов студентов (MongoID)',
  })
  @IsArray({ message: 'StudentIds должен быть массивом' })
  @ArrayNotEmpty({
    message: 'Массив идентификаторов студентов не может быть пустым',
  })
  @IsNotEmpty({
    each: true,
    message: 'Каждый идентификатор студента не может быть пустым',
  })
  @IsMongoId({
    each: true,
    message: 'Каждый идентификатор студента должен быть валидным MongoID',
  })
  studentIds: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    description: 'Массив идентификаторов курсов (MongoID)',
  })
  @IsArray({ message: 'CourseIds должен быть массивом' })
  @ArrayNotEmpty({
    message: 'Массив идентификаторов курсов не может быть пустым',
  })
  @IsNotEmpty({
    each: true,
    message: 'Каждый идентификатор курса не может быть пустым',
  })
  @IsMongoId({
    each: true,
    message: 'Каждый идентификатор курса должен быть валидным MongoID',
  })
  courseIds: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439015', '507f1f77bcf86cd799439016'],
    description: 'Массив идентификаторов потоков (MongoID, опционально)',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'StreamIds должен быть массивом' })
  @IsMongoId({
    each: true,
    message: 'Каждый идентификатор потока должен быть валидным MongoID',
  })
  streamIds?: string[];

  @ApiProperty({
    example: ['2025-12-31T23:59:59.999Z', '2025-12-31T23:59:59.999Z'],
    description: 'Массив дедлайнов в формате ISO (опционально)',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Deadlines должен быть массивом' })
  @IsDateString(
    {},
    {
      each: true,
      message:
        'Каждый дедлайн должен быть валидной строкой ISO (например, "2025-03-15T00:00:00Z")',
    },
  )
  deadlines?: string[];
}
