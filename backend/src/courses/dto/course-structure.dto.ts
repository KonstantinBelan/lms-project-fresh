import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsString } from 'class-validator';

export class LessonDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  lessonId: string;

  @ApiProperty({ example: 'Введение в программирование' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Контент урока...' })
  @IsString()
  content: string;
}

export class ModuleDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  moduleId: string;

  @ApiProperty({ example: 'Модуль 1' })
  @IsString()
  title: string;

  @ApiProperty({ type: [LessonDto] })
  @IsArray()
  lessons: LessonDto[];
}

export class CourseStructureDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  courseId: string;

  @ApiProperty({ example: 'Курс по Nest.js' })
  @IsString()
  title: string;

  @ApiProperty({ type: [ModuleDto] })
  @IsArray()
  modules: ModuleDto[];
}
