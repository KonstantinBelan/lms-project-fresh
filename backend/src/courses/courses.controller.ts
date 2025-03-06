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
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { BatchCourseDto } from './dto/batch-course.dto';
import { Role } from '../auth/roles.enum';
import { Response } from 'express';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  @Post('batch')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createBatch(@Body() batchCourseDto: BatchCourseDto) {
    return this.coursesService.createBatchCourses(batchCourseDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findAll() {
    return this.coursesService.findAllCourses();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findOne(@Param('id') id: string) {
    return this.coursesService.findCourseById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  async delete(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  @Post(':courseId/modules')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createModule(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    return this.coursesService.createModule(courseId, createModuleDto);
  }

  @Get(':courseId/modules/:moduleId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
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
  @SetMetadata('roles', [
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
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
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
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
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  async getCourseStatistics(@Param('id') courseId: string) {
    return this.coursesService.getCourseStatistics(courseId);
  }

  @Put(':courseId/modules/:moduleId/lessons/:lessonId')
  @SetMetadata('roles', [Role.ADMIN])
  async updateLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: CreateLessonDto, // Можно создать отдельный UpdateLessonDto
  ) {
    return this.coursesService.updateLesson(
      courseId,
      moduleId,
      lessonId,
      updateLessonDto,
    );
  }

  @Delete(':courseId/modules/:moduleId/lessons/:lessonId')
  @SetMetadata('roles', [Role.ADMIN])
  async deleteLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.coursesService.deleteLesson(courseId, moduleId, lessonId);
  }

  @Get(':courseId/analytics')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseAnalytics(courseId);
  }

  @Get(':courseId/export/csv')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async exportCourseAnalytics(
    @Param('courseId') courseId: string,
    @Res() res: Response,
  ) {
    const filePath =
      await this.coursesService.exportCourseAnalyticsToCSV(courseId);
    res.download(filePath);
  }
}
