import { IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedFilterDto } from '../../common/dto/paginated-filter.dto';

// DTO для фильтрации записей о зачислении с пагинацией
export class GetEnrollmentsDto extends PaginatedFilterDto {
  @ApiProperty({
    description: 'ID курса для фильтрации записей',
    required: false,
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @ApiProperty({
    description: 'ID пользователя для фильтрации записей',
    required: false,
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsMongoId()
  studentId?: string;
}
