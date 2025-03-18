import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedFilterDto } from '../../common/dto/paginated-filter.dto';

// DTO для фильтрации курсов с пагинацией
export class GetCoursesDto extends PaginatedFilterDto {
  @ApiProperty({
    description: 'Название курса для фильтрации (частичное совпадение)',
    required: false,
    example: 'Математика',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'Этот курс знакомит с основами программирования.',
    required: false,
    description: 'Описание курса',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
