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
  Catch,
  HttpException,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CompleteCourseDto } from './dto/complete-course.dto';
import { AlreadyEnrolledException } from './exceptions/already-enrolled.exception';
import { BatchEnrollmentDto } from './dto/batch-enrollment.dto';
import { Response } from 'express';
import { Role } from '../auth/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Enrollments')
@Controller('enrollments')
@Catch(AlreadyEnrolledException)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new enrollment' })
  @ApiResponse({
    status: 201,
    description: 'Enrollment created',
    type: CreateEnrollmentDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    try {
      const deadline = createEnrollmentDto.deadline
        ? new Date(createEnrollmentDto.deadline)
        : undefined;
      return await this.enrollmentsService.createEnrollment(
        createEnrollmentDto.studentId,
        createEnrollmentDto.courseId,
        deadline,
      );
    } catch (error) {
      if (error instanceof AlreadyEnrolledException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Create multiple enrollments' })
  @ApiResponse({
    status: 201,
    description: 'Enrollments created',
    type: BatchEnrollmentDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createBatch(@Body() batchEnrollmentDto: BatchEnrollmentDto) {
    return this.enrollmentsService.createBatchEnrollments(batchEnrollmentDto);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get enrollments by student ID' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollments retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Enrollments not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentsService.findEnrollmentsByStudent(studentId);
  }

  @Get('student/:studentId/course/:courseId/progress')
  @ApiOperation({ summary: 'Get student progress by course ID' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Progress not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async getStudentProgress(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.getStudentProgress(studentId, courseId);
  }

  @Get('student/:studentId/detailed-progress')
  @ApiOperation({ summary: 'Get detailed student progress' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed progress retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Detailed progress not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async getDetailedStudentProgress(@Param('studentId') studentId: string) {
    return this.enrollmentsService.getDetailedStudentProgress(studentId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get enrollments by course ID' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollments retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Enrollments not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async getCourseEnrollments(@Param('courseId') courseId: string) {
    return this.enrollmentsService.findEnrollmentsByCourse(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment found',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
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
    return this.enrollmentsService.findEnrollmentById(id);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update student progress' })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress updated',
    type: UpdateProgressDto,
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT, Role.ASSISTANT])
  @UsePipes(new ValidationPipe())
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    const enrollment = await this.enrollmentsService.findEnrollmentById(id);
    if (!enrollment) {
      throw new HttpException('Enrollment not found', HttpStatus.NOT_FOUND);
    }
    return this.enrollmentsService.updateStudentProgress(
      enrollment.studentId.toString(),
      enrollment.courseId.toString(),
      updateProgressDto.moduleId,
      updateProgressDto.lessonId,
    );
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete a course' })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course completed',
    type: CompleteCourseDto,
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async completeCourse(
    @Param('id') id: string,
    @Body() completeCourseDto: CompleteCourseDto,
  ) {
    return this.enrollmentsService.completeCourse(id, completeCourseDto.grade);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an enrollment' })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment deleted',
    schema: {
      example: { message: 'Enrollment deleted' },
    },
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  async delete(@Param('id') id: string) {
    return this.enrollmentsService.deleteEnrollment(id);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export enrollments to CSV' })
  @ApiResponse({
    status: 200,
    description: 'Enrollments exported successfully',
  })
  @ApiResponse({ status: 404, description: 'Enrollments not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  async exportCsv(@Res() res: Response) {
    const csv = await this.enrollmentsService.exportEnrollmentsToCsv();
    res.set('Content-Type', 'text/csv'); // Используем set вместо header
    res.set('Content-Disposition', 'attachment; filename=enrollments.csv');
    res.send(csv);
  }

  @Get('test-index/:studentId/:courseId')
  @ApiOperation({ summary: 'Test index' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Test index retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Test index not found' })
  async testIndex(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.findEnrollmentByStudentAndCourse(
      studentId,
      courseId,
    );
  }

  @Post('lesson/complete')
  @ApiOperation({ summary: 'Complete a lesson and award points' })
  @ApiResponse({ status: 200, description: 'Lesson completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new ValidationPipe())
  async completeLesson(
    @Body('studentId') studentId: string,
    @Body('courseId') courseId: string,
    @Body('lessonId') lessonId: string,
  ) {
    if (!studentId || !courseId || !lessonId) {
      throw new BadRequestException(
        'studentId, courseId, and lessonId are required',
      );
    }
    return this.enrollmentsService.completeLesson(
      studentId,
      courseId,
      lessonId,
    );
  }
}
