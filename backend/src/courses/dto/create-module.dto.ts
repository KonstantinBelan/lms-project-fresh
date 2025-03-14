import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({
    example: 'Модуль 1: Введение',
    description: 'Название модуля',
    examples: {
      intro: { value: 'Модуль 1: Введение' },
      advanced: { value: 'Модуль 2: Алгоритмы' },
    },
  })
  @IsString({ message: 'Название модуля должно быть строкой' })
  @IsNotEmpty({ message: 'Название модуля не может быть пустым' })
  title: string;

  @ApiProperty({
    example: 'Описание модуля с вводной информацией.',
    description: 'Описание модуля (опционально)',
    required: false,
    examples: {
      short: { value: 'Краткое описание модуля.' },
      detailed: { value: 'Подробное описание целей и задач модуля.' },
    },
  })
  @IsOptional()
  @IsString({ message: 'Описание модуля должно быть строкой' })
  description?: string;
}

export interface ICreateModuleDto {
  title: string;
  description?: string;
}
