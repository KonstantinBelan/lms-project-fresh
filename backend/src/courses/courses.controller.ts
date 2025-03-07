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
import { LeaderboardEntry } from './dto/leaderboard-entry.dto';
import { Role } from '../auth/roles.enum';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: 201,
    description: 'Course created',
    type: CreateCourseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Create multiple courses' })
  @ApiResponse({
    status: 201,
    description: 'Courses created',
    type: BatchCourseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createBatch(@Body() batchCourseDto: BatchCourseDto) {
    return this.coursesService.createBatchCourses(batchCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
    type: [CreateCourseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({
    name: 'id',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course found',
    type: CreateCourseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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

  @Get(':courseId/structure')
  @ApiOperation({ summary: 'Get course structure' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course structure retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async courseStructure(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseStructure(courseId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({
    name: 'id',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course updated',
    type: UpdateCourseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
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
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({
    name: 'id',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course deleted',
    schema: {
      example: { message: 'Course deleted' },
    },
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  async delete(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  @Post(':courseId/modules')
  @ApiOperation({ summary: 'Create a new module' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Module created',
    type: CreateModuleDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Course not found' })
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
  @ApiOperation({ summary: 'Get module by ID' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'Module ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Module found',
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'Module ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Lesson created',
    type: CreateLessonDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Course or module not found' })
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
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'Module ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson found',
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiOperation({ summary: 'Get course statistics' })
  @ApiParam({
    name: 'id',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  async getCourseStatistics(@Param('id') courseId: string) {
    return this.coursesService.getCourseStatistics(courseId);
  }

  @Put(':courseId/modules/:moduleId/lessons/:lessonId')
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'Module ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson updated',
    type: CreateLessonDto, // Можно создать отдельный UpdateLessonDto
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN])
  async updateLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.updateLesson(
      courseId,
      moduleId,
      lessonId,
      updateLessonDto,
    );
  }

  @Delete(':courseId/modules/:moduleId/lessons/:lessonId')
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'Module ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson deleted',
    schema: {
      example: { message: 'Lesson deleted' },
    },
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN])
  async deleteLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.coursesService.deleteLesson(courseId, moduleId, lessonId);
  }

  @Get(':courseId/analytics')
  @ApiOperation({ summary: 'Get course analytics' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course analytics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseAnalytics(courseId);
  }

  @Get(':courseId/export/csv')
  @ApiOperation({ summary: 'Export course analytics to CSV' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course analytics exported successfully',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async exportCourseAnalytics(
    @Param('courseId') courseId: string,
    @Res() res: Response,
  ) {
    const filePath =
      await this.coursesService.exportCourseAnalyticsToCSV(courseId);
    res.download(filePath);
  }

  @Get(':courseId/leaderboard')
  @ApiOperation({
    summary: 'Get course leaderboard',
    description: 'Returns the top 10 students by points earned in the course.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved',
    type: [LeaderboardEntry],
  })
  @ApiResponse({ status: 400, description: 'Invalid courseId' })
  async getLeaderboard(
    @Param('courseId') courseId: string,
  ): Promise<LeaderboardEntry[]> {
    return this.coursesService.getLeaderboard(courseId);
  }
}
