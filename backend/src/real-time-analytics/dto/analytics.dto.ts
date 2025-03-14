import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO для подписки на прогресс студента
export class SubscribeProgressDto {
  @ApiProperty({
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

// DTO для подписки на активность курса
export class SubscribeActivityDto {
  @ApiProperty({
    description: 'Идентификатор курса',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
