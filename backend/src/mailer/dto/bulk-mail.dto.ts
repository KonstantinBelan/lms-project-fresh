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
  @ApiProperty({
    description: 'Email получателя',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Поле "to" обязательно' })
  @IsString({ message: 'Поле "to" должно быть строкой' })
  to: string;

  @ApiProperty({
    description: 'Контекст для шаблона письма',
    example: { name: 'Иван', courseTitle: 'Nest.js Basics' },
  })
  @IsObject({ message: 'Поле "context" должно быть объектом' })
  context: MailContext;
}

export class BulkMailDto {
  @ApiProperty({
    description: 'Массив получателей письма',
    type: [RecipientDto],
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
