import { IsOptional, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// DTO для фильтрации уведомлений с пагинацией
export class GetNotificationsDto {
  @ApiProperty({
    description: 'ID пользователя для фильтрации уведомлений',
    required: false,
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiProperty({
    description: 'ID курса для фильтрации уведомлений (если применимо)',
    required: false,
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  courseId?: string;

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
