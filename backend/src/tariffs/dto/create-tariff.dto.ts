// src/tariffs/dto/create-tariff.dto.ts
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
    description: 'ID of the course this tariff applies to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: 'courseId must be a valid MongoDB ObjectId' })
  courseId: string;

  @ApiProperty({
    description: 'Name of the tariff',
    example: 'Только посмотреть',
  })
  @IsString({ message: 'name must be a string' })
  name: string;

  @ApiProperty({
    description: 'Price of the tariff in the specified currency',
    example: 1000,
  })
  @IsNumber({}, { message: 'price must be a number' })
  price: number;

  @ApiProperty({
    description: 'Array of module IDs accessible under this tariff',
    example: ['507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray({ message: 'accessibleModules must be an array' })
  @IsMongoId({
    each: true,
    message: 'Each accessibleModules item must be a valid MongoDB ObjectId',
  })
  accessibleModules: string[];

  @ApiProperty({
    description: 'Whether this tariff includes homework access',
    example: false,
  })
  @IsBoolean({ message: 'includesHomeworks must be a boolean' })
  includesHomeworks: boolean;

  @ApiProperty({
    description: 'Whether this tariff includes points accumulation',
    example: false,
  })
  @IsBoolean({ message: 'includesPoints must be a boolean' })
  includesPoints: boolean;
}
