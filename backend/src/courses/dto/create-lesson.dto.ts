import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({
    example: 'Урок 1',
    description: 'Название урока',
  })
  @IsString()
  @IsNotEmpty({ message: 'Название урока не может быть пустым' })
  title: string;

  @ApiProperty({
    example: 'Это содержимое урока 1',
    description: 'Содержимое урока',
  })
  @IsString()
  @IsNotEmpty({ message: 'Содержимое урока не может быть пустым' })
  content: string;

  @ApiProperty({
    example: 'http://example.com/media',
    description: 'Опциональная ссылка на мультимедиа для урока',
    required: false,
  })
  @IsOptional()
  @IsString()
  media?: string;
}
