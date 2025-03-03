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
import { BatchCourseDto } from './dto/batch-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin'])
  @UsePipes(new ValidationPipe())
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  @Post('batch')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['admin'])
  @UsePipes(new ValidationPipe())
  async createBatch(@Body() batchCourseDto: BatchCourseDto) {
    return this.coursesService.createBatchCourses(batchCourseDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  async findAll() {
    return this.coursesService.findAllCourses();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  async findOne(@Param('id') id: string) {
    return this.coursesService.findCourseById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin'])
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['admin'])
  async delete(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  @Post(':courseId/modules')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin'])
  @UsePipes(new ValidationPipe())
  async createModule(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    return this.coursesService.createModule(courseId, createModuleDto);
  }

  @Get(':courseId/modules/:moduleId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  async findModule(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
  ) {
    const course = await this.coursesService.findCourseById(courseId);
    if (!course) throw new Error('Course not found');
    const module = await this.coursesService.findModuleById(moduleId);
    if (!module) throw new Error('Module not found');
    return module;
  }

  @Post(':courseId/modules/:moduleId/lessons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin'])
  @UsePipes(new ValidationPipe())
  async createLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.createLesson(
      courseId,
      moduleId,
      createLessonDto,
    );
  }

  @Get(':courseId/modules/:moduleId/lessons/:lessonId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  async findLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ) {
    const course = await this.coursesService.findCourseById(courseId);
    if (!course) throw new Error('Course not found');
    const module = await this.coursesService.findModuleById(moduleId);
    if (!module) throw new Error('Module not found');
    const lesson = await this.coursesService.findLessonById(lessonId);
    if (!lesson) throw new Error('Lesson not found');
    return lesson;
  }

  @Get(':id/statistics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin'])
  async getCourseStatistics(@Param('id') courseId: string) {
    return this.coursesService.getCourseStatistics(courseId);
  }
}
