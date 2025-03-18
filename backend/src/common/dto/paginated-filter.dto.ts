import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedFilterDto {
  @ApiProperty({
    description: 'Номер страницы для пагинации (начинается с 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Количество записей на странице (максимум 100)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginatedFilterTotalDto {
  @ApiProperty({
    type: Number,
    example: 50,
    description: 'Общее количество записей',
  })
  total: number;

  @ApiProperty({ type: Number, example: 1, description: 'Текущая страница' })
  page: number;

  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Лимит записей на страницу',
  })
  limit: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Общее количество страниц',
  })
  totalPages: number;
}
