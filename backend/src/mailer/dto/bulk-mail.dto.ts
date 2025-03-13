import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MailContext } from '../mailer.interface';

export class RecipientDto {
  @IsNotEmpty({ message: 'Поле "to" обязательно' })
  @IsString({ message: 'Поле "to" должно быть строкой' })
  to: string;

  @IsObject({ message: 'Поле "context" должно быть объектом' })
  context: MailContext;
}

// DTO для тела запроса массовой рассылки
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
  @IsArray({ message: 'Поле "recipients" должно быть массивом' })
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];

  @ApiProperty({
    description: 'Тема письма',
    example: 'Важное уведомление',
  })
  @IsNotEmpty({ message: 'Поле "subject" обязательно' })
  @IsString({ message: 'Поле "subject" должно быть строкой' })
  subject: string;

  @ApiProperty({
    description: 'Название шаблона письма',
    example: 'welcome',
  })
  @IsNotEmpty({ message: 'Поле "template" обязательно' })
  @IsString({ message: 'Поле "template" должно быть строкой' })
  template: string;
}
