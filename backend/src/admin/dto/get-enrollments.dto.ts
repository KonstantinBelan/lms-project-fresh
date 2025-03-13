import { IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetEnrollmentsDto {
  @ApiProperty({
    description: 'ID курса для фильтрации записей',
    required: false,
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  courseId?: string;
}
