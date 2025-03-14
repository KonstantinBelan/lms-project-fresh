import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTariffDto {
  @ApiProperty({
    description: 'ID курса, к которому применяется тариф',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'courseId должен быть валидным MongoDB ObjectId' })
  courseId: string;

  @ApiProperty({
    description: 'Название тарифа',
    example: 'Только посмотреть',
  })
  @IsString({ message: 'name должен быть строкой' })
  name: string;

  @ApiProperty({
    description: 'Цена тарифа в указанной валюте',
    example: 1000,
  })
  @IsNumber({}, { message: 'price должен быть числом' })
  price: number;

  @ApiProperty({
    description: 'Массив ID модулей, доступных по этому тарифу',
    example: ['507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray({ message: 'accessibleModules должен быть массивом' })
  @IsMongoId({
    each: true,
    message:
      'Каждый элемент accessibleModules должен быть валидным MongoDB ObjectId',
  })
  accessibleModules: string[];

  @ApiProperty({
    description: 'Включает ли тариф доступ к домашним заданиям',
    example: false,
  })
  @IsBoolean({ message: 'includesHomeworks должен быть булевым значением' })
  includesHomeworks: boolean;

  @ApiProperty({
    description: 'Включает ли тариф накопление баллов',
    example: false,
  })
  @IsBoolean({ message: 'includesPoints должен быть булевым значением' })
  includesPoints: boolean;
}
