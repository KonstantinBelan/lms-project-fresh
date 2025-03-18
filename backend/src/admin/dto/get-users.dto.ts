import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginatedFilterDto } from '../../common/dto/paginated-filter.dto';

export class GetUsersDto extends PaginatedFilterDto {
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
}
