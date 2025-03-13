import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConnectTelegramDto {
  @ApiProperty({ description: 'ID чата Telegram', example: '123456789' })
  @IsString()
  @Matches(/^\d+$/, { message: 'Telegram ID должен содержать только цифры' })
  telegramId: string;
}
