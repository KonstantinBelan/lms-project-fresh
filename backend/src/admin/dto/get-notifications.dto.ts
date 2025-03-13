import { IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetNotificationsDto {
  @ApiProperty({
    description: 'ID пользователя для фильтрации уведомлений',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;
}
