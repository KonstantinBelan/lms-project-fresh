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
    example: 'Это комментарий преподавателя',
    description: 'Обновлённый комментарий преподавателя',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Комментарий преподавателя должен быть строкой' })
  teacherComment?: string;

  @ApiProperty({
    example: 85,
    description: 'Обновлённая оценка за решение (от 0 до 100)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Оценка должна быть числом' })
  @Min(0, { message: 'Оценка не может быть меньше 0' })
  @Max(100, { message: 'Оценка не может превышать 100' })
  grade?: number;

  @ApiProperty({
    example: true,
    description: 'Обновлённый статус проверки решения',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Статус проверки должен быть булевым значением' })
  isReviewed?: boolean;
}
