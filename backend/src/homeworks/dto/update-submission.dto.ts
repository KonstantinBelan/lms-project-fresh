import { PartialType } from '@nestjs/mapped-types';
import { CreateSubmissionDto } from './create-submission.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class UpdateSubmissionDto extends PartialType(CreateSubmissionDto) {
  @ApiProperty({
    example: 'Хорошая работа, но нужно больше деталей',
    description: 'Комментарий преподавателя',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Комментарий должен быть строкой' })
  teacherComment?: string;

  @ApiProperty({
    example: 90,
    description: 'Оценка за решение (от 0 до 100)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Оценка должна быть числом' })
  @Min(0, { message: 'Оценка не может быть меньше 0' })
  @Max(100, { message: 'Оценка не может превышать 100' })
  grade?: number;

  @ApiProperty({
    example: true,
    description: 'Статус проверки решения',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Статус проверки должен быть булевым' })
  isReviewed?: boolean;
}
