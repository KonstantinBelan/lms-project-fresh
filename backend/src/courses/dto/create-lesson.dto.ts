import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({
    example: 'Урок 1: Основы программирования',
    description: 'Название урока',
    examples: {
      basic: { value: 'Урок 1: Основы программирования' },
      advanced: { value: 'Урок 2: Алгоритмы и структуры данных' },
    },
  })
  @IsString({ message: 'Название урока должно быть строкой' })
  @IsNotEmpty({ message: 'Название урока не может быть пустым' })
  title: string;

  @ApiProperty({
    example: 'В этом уроке вы изучите базовые концепции программирования.',
    description: 'Содержимое урока',
    examples: {
      short: { value: 'Краткое описание урока.' },
      detailed: { value: 'Подробное содержимое с примерами кода.' },
    },
  })
  @IsString({ message: 'Содержимое урока должно быть строкой' })
  @IsNotEmpty({ message: 'Содержимое урока не может быть пустым' })
  content: string;

  @ApiProperty({
    example: 'https://example.com/video.mp4',
    description: 'Опциональная ссылка на мультимедиа для урока',
    required: false,
    examples: {
      video: { value: 'https://example.com/video.mp4' },
      image: { value: 'https://example.com/image.jpg' },
    },
  })
  @IsOptional()
  @IsString({ message: 'Ссылка на мультимедиа должна быть строкой' })
  @IsUrl({}, { message: 'Ссылка на мультимедиа должна быть валидным URL' })
  media?: string;
}
