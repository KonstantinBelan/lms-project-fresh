import { ApiProperty } from '@nestjs/swagger';

// DTO для описания ответа с ошибкой
export class ErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP-код статуса ошибки',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Неверные данные',
    description: 'Сообщение об ошибке для пользователя',
  })
  message: string;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Подробное описание типа ошибки',
  })
  error: string;
}
