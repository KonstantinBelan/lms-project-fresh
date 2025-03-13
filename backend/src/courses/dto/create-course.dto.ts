import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Введение в программирование',
    description: 'Название курса',
  })
  @IsString()
  @IsNotEmpty({ message: 'Название курса не может быть пустым' })
  title: string;

  @ApiProperty({
    example: 'Этот курс знакомит с основами программирования.',
    description: 'Описание курса',
  })
  @IsString()
  @IsNotEmpty({ message: 'Описание курса не может быть пустым' })
  description: string;
}
