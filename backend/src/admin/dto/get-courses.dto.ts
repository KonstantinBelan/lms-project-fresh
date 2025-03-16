import {
  IsOptional,
  IsString,
  IsMongoId,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Course } from '../../courses/schemas/course.schema';

// DTO для фильтрации курсов с пагинацией
export class GetCoursesDto {
  @ApiProperty({
    description: 'Название курса для фильтрации (частичное совпадение)',
    required: false,
    example: 'Математика',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Номер страницы (начиная с 1)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number) // Преобразует строку в число
  @IsInt({ message: 'page должен быть целым числом' })
  @Min(1, { message: 'page должен быть не меньше 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number) // Преобразует строку в число
  @IsInt({ message: 'limit должен быть целым числом' })
  @Min(1, { message: 'limit должен быть не меньше 1' })
  @Max(100, { message: 'limit не должен превышать 100' })
  limit?: number = 10;
}

// Интерфейс для типизации ответа с курсами
export interface ICourseResponse {
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
