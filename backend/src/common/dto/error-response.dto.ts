import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Код статуса HTTP' })
  statusCode: number;

  @ApiProperty({
    example: 'Неверные данные',
    description: 'Сообщение об ошибке',
  })
  message: string;

  @ApiProperty({ example: 'Bad Request', description: 'Детали ошибки' })
  error: string;
}
