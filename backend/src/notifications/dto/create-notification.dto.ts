// src/notifications/dto/create-notification.dto.ts
import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'new_course',
    description: 'Ключ уведомления (уникальный идентификатор шаблона)',
    required: false,
  })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({
    example: 'Важное объявление',
    description: 'Заголовок уведомления',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Это тестовое уведомление',
    description: 'Сообщение уведомления',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор одного пользователя (опционально)',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '67c92217f30e0a8bcd56bf86'],
    description: 'Массив идентификаторов получателей (опционально)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  recipients?: string[];
}
