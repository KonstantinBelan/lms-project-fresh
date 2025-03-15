import { ApiProperty } from '@nestjs/swagger';

export interface IStreamResponse {
  _id: string;
  courseId: string;
  name: string;
  startDate: string;
  endDate: string;
  students: string[];
}

export class StreamResponseDto implements IStreamResponse {
  @ApiProperty({
    description: 'Уникальный идентификатор потока',
    example: '507f1f77bcf86cd799439012',
  })
  _id: string;

  @ApiProperty({
    description: 'Идентификатор курса, к которому относится поток',
    example: '507f1f77bcf86cd799439011',
  })
  courseId: string;

  @ApiProperty({
    description: 'Название потока',
    example: 'Поток 1 - Март 2025',
  })
  name: string;

  @ApiProperty({
    description: 'Дата начала потока в формате ISO',
    example: '2025-03-01T00:00:00.000Z',
  })
  startDate: string;

  @ApiProperty({
    description: 'Дата окончания потока в формате ISO',
    example: '2025-03-31T23:59:59.999Z',
  })
  endDate: string;

  @ApiProperty({
    description: 'Массив идентификаторов студентов, записанных в поток',
    example: ['67c92217f30e0a8bcd56bf86'],
    type: [String],
  })
  students: string[];
}
