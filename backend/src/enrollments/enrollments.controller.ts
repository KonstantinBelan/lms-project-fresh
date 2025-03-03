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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CompleteCourseDto } from './dto/complete-course.dto';
import { AlreadyEnrolledException } from './exceptions/already-enrolled.exception'; // Импортируем исключение

@Controller('enrollments')
@Catch(AlreadyEnrolledException)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  @UsePipes(new ValidationPipe())
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    try {
      return await this.enrollmentsService.createEnrollment(
        createEnrollmentDto.studentId,
        createEnrollmentDto.courseId,
      );
    } catch (error) {
      if (error instanceof AlreadyEnrolledException) {
        throw error; // Перебрасываем кастомное исключение
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('student/:studentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  async findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentsService.findEnrollmentsByStudent(studentId);
  }

  @Get('student/:studentId/progress')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  async getStudentProgress(@Param('studentId') studentId: string) {
    return this.enrollmentsService.getStudentProgress(studentId);
  }

  @Get('student/:studentId/detailed-progress')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  async getDetailedStudentProgress(@Param('studentId') studentId: string) {
    return this.enrollmentsService.getDetailedStudentProgress(studentId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student', 'teacher', 'admin'])
  async findOne(@Param('id') id: string) {
    return this.enrollmentsService.findEnrollmentById(id);
  }

  @Put(':id/progress')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['student'])
  @UsePipes(new ValidationPipe())
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.enrollmentsService.updateProgress(
      id,
      updateProgressDto.moduleId,
      updateProgressDto.lessonId,
    );
  }

  @Put(':id/complete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['teacher', 'admin'])
  @UsePipes(new ValidationPipe())
  async completeCourse(
    @Param('id') id: string,
    @Body() completeCourseDto: CompleteCourseDto,
  ) {
    return this.enrollmentsService.completeCourse(id, completeCourseDto.grade);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', ['admin'])
  async delete(@Param('id') id: string) {
    return this.enrollmentsService.deleteEnrollment(id);
  }
}
