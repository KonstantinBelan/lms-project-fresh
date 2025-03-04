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

@Controller('enrollments')
@Catch(AlreadyEnrolledException)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createBatch(@Body() batchEnrollmentDto: BatchEnrollmentDto) {
    return this.enrollmentsService.createBatchEnrollments(batchEnrollmentDto);
  }

  @Get('student/:studentId')
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

  @Get('student/:studentId/progress/:courseId')
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
    return this.enrollmentsService.findEnrollmentById(id);
  }

  @Put(':id/progress')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT, Role.ASSISTANT])
  @UsePipes(new ValidationPipe())
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.enrollmentsService.updateStudentProgress(
      id.split('.')[0], // Предполагаем, что id может содержать дополнительные данные, берём только studentId
      (
        await this.enrollmentsService.findEnrollmentById(id)
      )?.courseId.toString() || '',
      updateProgressDto.moduleId,
      updateProgressDto.lessonId,
    );
  }

  @Put(':id/complete')
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  async delete(@Param('id') id: string) {
    return this.enrollmentsService.deleteEnrollment(id);
  }

  @Get('export/csv')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  async exportCsv(@Res() res: Response) {
    const csv = await this.enrollmentsService.exportEnrollmentsToCsv();
    res.set('Content-Type', 'text/csv'); // Используем set вместо header
    res.set('Content-Disposition', 'attachment; filename=enrollments.csv');
    res.send(csv);
  }
}
