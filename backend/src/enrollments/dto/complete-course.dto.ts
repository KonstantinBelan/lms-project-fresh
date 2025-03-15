import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO для завершения курса
export class CompleteCourseDto {
  @ApiProperty({
    example: 85,
    description: 'Оценка, полученная за курс (от 0 до 100)',
  })
  @IsNumber({}, { message: 'Оценка должна быть числом' })
  @Min(0, { message: 'Оценка не может быть меньше 0' })
  @Max(100, { message: 'Оценка не может быть больше 100' })
  grade: number;
}
