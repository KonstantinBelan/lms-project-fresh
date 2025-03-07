import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConnectTelegramDto {
  @ApiProperty({ description: 'Telegram chat ID', example: '123456789' })
  @IsString()
  telegramId: string;
}
