import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../schemas/course.schema';

// DTO для ответа с данными пользователя
export class CourseResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: 'Курс по Nest.js' })
  title: string;

  @ApiProperty({ example: 'Этот курс знакомит с основами программирования.' })
  description?: string;

  // @ApiProperty({ type: [ModuleDto] })
  // @IsArray()
  // modules?: string[];

  constructor(course: Course) {
    this._id = course._id.toString();
    this.title = course.title;
    this.description = course.description;
    // this.modules = course.modules?.map((module) => module.toString());
  }
}
