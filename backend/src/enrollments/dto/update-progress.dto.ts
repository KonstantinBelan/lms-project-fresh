import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// DTO для обновления прогресса студента
export class UpdateProgressDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор модуля',
  })
  @IsMongoId({ message: 'Идентификатор модуля должен быть валидным MongoID' })
  @IsNotEmpty({ message: 'Идентификатор модуля обязателен' })
  moduleId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор урока',
  })
  @IsMongoId({ message: 'Идентификатор урока должен быть валидным MongoID' })
  @IsNotEmpty({ message: 'Идентификатор урока обязателен' })
  lessonId: string;
}
