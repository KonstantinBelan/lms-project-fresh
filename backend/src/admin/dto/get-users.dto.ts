import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUsersDto {
  @ApiProperty({
    description: 'Фильтр по ролям пользователей (перечисление через запятую)',
    example: 'student,teacher',
    required: false,
  })
  @IsOptional()
  @IsString()
  roles?: string;

  @ApiProperty({
    description:
      'Фильтр по email (частичное совпадение, нечувствителен к регистру)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Фильтр по ID групп (перечисление через запятую)',
    example: '507f1f77bcf86cd799439011,507f1f77bcf86cd799439012',
    required: false,
  })
  @IsOptional()
  @IsString()
  groups?: string;

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
