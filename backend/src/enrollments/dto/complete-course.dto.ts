import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteCourseDto {
  @ApiProperty({
    example: 85,
    description: 'The grade obtained in the course',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;
}
