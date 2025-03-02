import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CoursesService } from './courses.service'; // Импортируем класс
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(
      createCourseDto.title,
      createCourseDto.description,
    );
  }

  @Get()
  async findAll() {
    return this.coursesService.findAllCourses();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findCourseById(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    const title = updateCourseDto.title ?? '';
    const description = updateCourseDto.description ?? '';
    return this.coursesService.updateCourse(id, title, description);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  @Post(':courseId/modules')
  @UsePipes(new ValidationPipe())
  async addModule(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    return this.coursesService.addModule(courseId, createModuleDto.title);
  }

  @Post(':courseId/modules/:moduleId/lessons')
  @UsePipes(new ValidationPipe())
  async addLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.addLesson(
      moduleId,
      createLessonDto.title,
      createLessonDto.content,
      createLessonDto.media,
    );
  }
}
