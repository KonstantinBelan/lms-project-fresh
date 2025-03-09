// src/tariffs/dto/tariff-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TariffResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the tariff',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'ID of the course this tariff applies to',
    example: '67c848283c783d942cafb829',
  })
  courseId: string;

  @ApiProperty({
    description: 'Name of the tariff',
    example: 'Только посмотреть',
  })
  name: string;

  @ApiProperty({
    description: 'Price of the tariff in the specified currency',
    example: 1000,
  })
  price: number;

  @ApiProperty({
    description: 'Array of module IDs accessible under this tariff',
    example: ['67c848283c783d942cafb82c'],
    type: [String],
  })
  accessibleModules: string[];

  @ApiProperty({
    description: 'Whether this tariff includes homework access',
    example: false,
  })
  includesHomeworks: boolean;

  @ApiProperty({
    description: 'Whether this tariff includes points accumulation',
    example: false,
  })
  includesPoints: boolean;
}
