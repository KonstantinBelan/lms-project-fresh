import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({
    description:
      'Идентификатор пользователя, которому отправляется уведомление',
    example: '67c92217f30e0a8bcd56bf86',
    required: true,
    type: String,
  })
  @IsMongoId()
  userId: string;
}
