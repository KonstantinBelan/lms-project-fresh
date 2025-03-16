import { IsArray, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendBulkNotificationDto {
  @ApiProperty({
    description: 'Массив идентификаторов получателей (опционально)',
    example: ['507f1f77bcf86cd799439011', '67c92217f30e0a8bcd56bf86'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  recipientIds?: string[];
}
