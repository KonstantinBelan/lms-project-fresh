import { IsNotEmpty, IsMongoId, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор домашнего задания',
  })
  @IsNotEmpty({
    message: 'Идентификатор домашнего задания не может быть пустым',
  })
  @IsMongoId({
    message:
      'Идентификатор домашнего задания должен быть валидным MongoDB ObjectId',
  })
  homeworkId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Идентификатор студента, отправившего решение',
  })
  @IsNotEmpty({ message: 'Идентификатор студента не может быть пустым' })
  @IsMongoId({
    message: 'Идентификатор студента должен быть валидным MongoDB ObjectId',
  })
  studentId: string;

  @ApiProperty({
    example: 'Моё решение: реализовал API на Nest.js',
    description: 'Содержимое решения (текст, ссылка или другая информация)',
  })
  @IsNotEmpty({ message: 'Содержимое решения не может быть пустым' })
  @IsString({ message: 'Содержимое решения должно быть строкой' })
  @Length(1, 5000, {
    message: 'Содержимое решения должно быть от 1 до 5000 символов',
  })
  submissionContent: string;
}
