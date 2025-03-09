// src/streams/dto/stream-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class StreamResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the stream',
    example: '507f1f77bcf86cd799439012',
  })
  _id: string;

  @ApiProperty({
    description: 'ID of the course this stream belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  courseId: string;

  @ApiProperty({
    description: 'Name of the stream',
    example: 'Поток 1 - Март 2025',
  })
  name: string;

  @ApiProperty({
    description: 'Start date of the stream in ISO format',
    example: '2025-03-01T00:00:00.000Z',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of the stream in ISO format',
    example: '2025-03-31T23:59:59.999Z',
  })
  endDate: string;

  @ApiProperty({
    description: 'Array of student IDs enrolled in this stream',
    example: ['67c92217f30e0a8bcd56bf86'],
    type: [String],
  })
  students: string[];
}
