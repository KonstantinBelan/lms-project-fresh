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
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin']) // Доступ только для учителей и администраторов
  @UsePipes(new ValidationPipe())
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(
      createCourseDto.title,
      createCourseDto.description,
    );
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin']) // Доступ для всех ролей
  async findAll() {
    return this.coursesService.findAllCourses();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin']) // Доступ для всех ролей
  async findOne(@Param('id') id: string) {
    return this.coursesService.findCourseById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin']) // Доступ только для учителей и администраторов
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['admin']) // Доступ только для администраторов
  async delete(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  @Post(':courseId/modules')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin']) // Доступ только для учителей и администраторов
  @UsePipes(new ValidationPipe())
  async addModule(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    return this.coursesService.addModule(courseId, createModuleDto.title);
  }

  @Post(':courseId/modules/:moduleId/lessons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin']) // Доступ только для учителей и администраторов
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
