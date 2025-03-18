import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { User } from '../../users/schemas/user.schema';

export class PaginatedUserResponseDto {
  @ApiProperty({
    description: 'Список пользователей',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Общее количество пользователей',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Текущая страница',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Количество записей на странице',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 5,
  })
  totalPages: number;
}
