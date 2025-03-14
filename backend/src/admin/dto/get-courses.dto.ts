import {
  IsOptional,
  IsString,
  IsMongoId,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
    description: 'ID преподавателя для фильтрации курсов',
    required: false,
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsMongoId()
  teacherId?: string;

  @ApiProperty({
    description: 'Номер страницы (начиная с 1)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
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
