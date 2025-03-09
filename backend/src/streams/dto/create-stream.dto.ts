// src/streams/dto/create-stream.dto.ts
import { IsString, IsDateString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStreamDto {
  @ApiProperty({
    description: 'ID of the course this stream belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'courseId must be a valid MongoDB ObjectId' })
  courseId: string;

  @ApiProperty({
    description: 'Name of the stream',
    example: 'Поток 1 - Март 2025',
  })
  @IsString({ message: 'name must be a string' })
  name: string;

  @ApiProperty({
    description: 'Start date of the stream in ISO format',
    example: '2025-03-01T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
  startDate: string; // Используем string для ISO даты

  @ApiProperty({
    description: 'End date of the stream in ISO format',
    example: '2025-03-31T23:59:59.999Z',
  })
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate: string; // Используем string для ISO даты
}
