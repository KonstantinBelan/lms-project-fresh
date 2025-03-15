import { IsString, IsDateString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStreamDto {
  @ApiProperty({
    description: 'Идентификатор курса, к которому относится поток',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'courseId должен быть валидным MongoDB ObjectId' })
  courseId: string;

  @ApiProperty({
    description: 'Название потока',
    example: 'Поток 1 - Март 2025',
  })
  @IsString({ message: 'name должен быть строкой' })
  name: string;

  @ApiProperty({
    description: 'Дата начала потока в формате ISO',
    example: '2025-03-01T00:00:00.000Z',
  })
  @IsDateString(
    {},
    { message: 'startDate должен быть валидной ISO строкой даты' },
  )
  startDate: string;

  @ApiProperty({
    description: 'Дата окончания потока в формате ISO',
    example: '2025-03-31T23:59:59.999Z',
  })
  @IsDateString(
    {},
    { message: 'endDate должен быть валидной ISO строкой даты' },
  )
  endDate: string;
}
