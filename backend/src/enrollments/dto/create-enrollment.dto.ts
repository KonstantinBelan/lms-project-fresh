import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsDateString,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO для создания записи о зачислении
export class CreateEnrollmentDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор студента',
  })
  @IsNotEmpty({ message: 'Идентификатор студента обязателен' })
  @IsMongoId({ message: 'Идентификатор студента должен быть валидным MongoID' })
  studentId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор курса',
  })
  @IsNotEmpty({ message: 'Идентификатор курса обязателен' })
  @IsMongoId({ message: 'Идентификатор курса должен быть валидным MongoID' })
  courseId: string;

  @ApiProperty({
    example: '2023-12-31T23:59:59.999Z',
    description: 'Дедлайн для зачисления (опционально)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Дедлайн должен быть валидной строкой ISO' })
  deadline?: string;

  @ApiProperty({
    description: 'Идентификатор потока (опционально)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Идентификатор потока должен быть строкой' })
  streamId?: string;

  @ApiProperty({
    description: 'Идентификатор тарифа (опционально)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Идентификатор тарифа должен быть строкой' })
  tariffId?: string;
}
