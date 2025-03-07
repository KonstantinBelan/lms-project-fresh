import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the user',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    example: 'This is a test notification message',
    description: 'The notification message',
  })
  @IsString()
  message: string;
}
