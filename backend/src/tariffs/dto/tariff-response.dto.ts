import { ApiProperty } from '@nestjs/swagger';

// Интерфейс для типизации ответа тарифа
export interface ITariffResponse {
  _id: string;
  courseId: string;
  name: string;
  price: number;
  accessibleModules: string[];
  includesHomeworks: boolean;
  includesPoints: boolean;
}

export class TariffResponseDto implements ITariffResponse {
  @ApiProperty({
    description: 'Уникальный идентификатор тарифа',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'Идентификатор курса, к которому применяется тариф',
    example: '67c848283c783d942cafb829',
  })
  courseId: string;

  @ApiProperty({
    description: 'Название тарифа',
    example: 'Только посмотреть',
  })
  name: string;

  @ApiProperty({
    description: 'Цена тарифа в указанной валюте',
    example: 1000,
  })
  price: number;

  @ApiProperty({
    description: 'Массив идентификаторов модулей, доступных по этому тарифу',
    example: ['67c848283c783d942cafb82c'],
    type: [String],
  })
  accessibleModules: string[];

  @ApiProperty({
    description: 'Включает ли тариф доступ к домашним заданиям',
    example: false,
  })
  includesHomeworks: boolean;

  @ApiProperty({
    description: 'Включает ли тариф накопление баллов',
    example: false,
  })
  includesPoints: boolean;
}
