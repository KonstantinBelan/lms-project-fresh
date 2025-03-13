import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

// DTO для валидации тела запроса массовой рассылки
export class BulkMailDto {
  @ApiProperty({
    description:
      'Массив получателей письма, каждый получатель содержит email и контекст для шаблона',
    example: [{ to: 'user@example.com', context: { name: 'Иван' } }],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        to: { type: 'string', example: 'user@example.com' },
        context: { type: 'object', example: { name: 'Иван' } },
      },
    },
  })
  recipients: { to: string; context: any }[];

  @ApiProperty({
    description: 'Тема письма',
    example: 'Важное уведомление',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Название шаблона письма',
    example: 'welcome-email',
  })
  @IsString()
  template: string;
}
