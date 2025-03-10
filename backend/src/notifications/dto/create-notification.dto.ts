// src/notifications/dto/create-notification.dto.ts
import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'Важное объявление',
    description: 'The title of the notification',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Это тестовое уведомление',
    description: 'The notification message',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of a single user (optional)',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '67c92217f30e0a8bcd56bf86'],
    description: 'Array of recipient IDs (optional)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  recipients?: string[];
}
