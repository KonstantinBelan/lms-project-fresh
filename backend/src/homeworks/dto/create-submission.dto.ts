import { IsNotEmpty, IsMongoId, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Интерфейс для DTO создания решения
export interface ICreateSubmissionDto {
  homeworkId: string;
  studentId: string;
  submissionContent: string;
}

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Идентификатор домашнего задания',
    example: '507f1f77bcf86cd799439011',
    required: true,
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
    description: 'Идентификатор студента, отправившего решение',
    example: '507f1f77bcf86cd799439012',
    required: true,
  })
  @IsNotEmpty({ message: 'Идентификатор студента не может быть пустым' })
  @IsMongoId({
    message: 'Идентификатор студента должен быть валидным MongoDB ObjectId',
  })
  studentId: string;

  @ApiProperty({
    description: 'Содержимое решения (текст, ссылка или другая информация)',
    examples: [
      'Моё решение: реализовал API на Nest.js',
      'Ссылка на репозиторий: https://github.com/user/repo',
      'Ответ на задание: 42',
    ],
    required: true,
  })
  @IsNotEmpty({ message: 'Содержимое решения не может быть пустым' })
  @IsString({ message: 'Содержимое решения должно быть строкой' })
  @Length(1, 5000, {
    message: 'Содержимое решения должно быть длиной от 1 до 5000 символов',
  })
  submissionContent: string;
}
