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
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';

@ApiTags('Зачисления')
@Controller('enrollments')
@Catch(AlreadyEnrolledException)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Создать новое зачисление' })
  @ApiResponse({
    status: 201,
    description: 'Зачисление успешно создано',
    type: CreateEnrollmentDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @ApiResponse({ status: 409, description: 'Студент уже зачислен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER)
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
        createEnrollmentDto.streamId,
        createEnrollmentDto.tariffId,
      );
    } catch (error) {
      if (error instanceof AlreadyEnrolledException) {
        throw error;
      }
      console.log('Ошибка в createEnrollment:', error); // Временный лог для отладки
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Не удалось создать зачисление',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Создать массовые зачисления' })
  @ApiResponse({
    status: 201,
    description: 'Зачисления успешно созданы',
    type: BatchEnrollmentDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async createBatch(@Body() batchEnrollmentDto: BatchEnrollmentDto) {
    return this.enrollmentsService.createBatchEnrollments(batchEnrollmentDto);
  }

  @Get('student/:studentId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить зачисления по идентификатору студента' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Зачисления успешно получены' })
  @ApiResponse({ status: 404, description: 'Зачисления не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentsService.findEnrollmentsByStudent(studentId);
  }

  @Get('student/:studentId/course/:courseId/progress')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить прогресс студента по курсу' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'courseId',
    description: 'Идентификатор курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Прогресс успешно получен' })
  @ApiResponse({ status: 404, description: 'Прогресс не найден' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async getStudentProgress(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.getStudentProgress(studentId, courseId);
  }

  @Get('student/:studentId/detailed-progress')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить детальный прогресс студента' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Детальный прогресс успешно получен',
  })
  @ApiResponse({ status: 404, description: 'Детальный прогресс не найден' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async getDetailedStudentProgress(@Param('studentId') studentId: string) {
    return this.enrollmentsService.getDetailedStudentProgress(studentId);
  }

  @Get('course/:courseId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить зачисления по идентификатору курса' })
  @ApiParam({
    name: 'courseId',
    description: 'Идентификатор курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Зачисления успешно получены' })
  @ApiResponse({ status: 404, description: 'Зачисления не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async getCourseEnrollments(@Param('courseId') courseId: string) {
    return this.enrollmentsService.findEnrollmentsByCourse(courseId);
  }

  @Get(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить зачисление по идентификатору' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор зачисления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Зачисление найдено' })
  @ApiResponse({ status: 404, description: 'Зачисление не найдено' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findOne(@Param('id') id: string) {
    return this.enrollmentsService.findEnrollmentById(id);
  }

  @Put(':id/progress')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Обновить прогресс студента' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор зачисления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Прогресс обновлен',
    type: UpdateProgressDto,
  })
  @ApiResponse({ status: 404, description: 'Зачисление не найдено' })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.ASSISTANT)
  @UsePipes(new ValidationPipe())
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    const enrollment = await this.enrollmentsService.findEnrollmentById(id);
    if (!enrollment) {
      throw new HttpException('Зачисление не найдено', HttpStatus.NOT_FOUND);
    }
    return this.enrollmentsService.updateStudentProgress(
      enrollment.studentId.toString(),
      enrollment.courseId.toString(),
      updateProgressDto.moduleId,
      updateProgressDto.lessonId,
    );
  }

  @Put(':id/complete')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Завершить курс' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор зачисления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Курс завершен',
    type: CompleteCourseDto,
  })
  @ApiResponse({ status: 404, description: 'Зачисление не найдено' })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async completeCourse(
    @Param('id') id: string,
    @Body() completeCourseDto: CompleteCourseDto,
  ) {
    return this.enrollmentsService.completeCourse(id, completeCourseDto.grade);
  }

  @Delete(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Удалить зачисление' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор зачисления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Зачисление удалено',
    schema: { example: { message: 'Зачисление удалено' } },
  })
  @ApiResponse({ status: 404, description: 'Зачисление не найдено' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async delete(@Param('id') id: string) {
    return this.enrollmentsService.deleteEnrollment(id);
  }

  @Get('export/csv')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Экспортировать зачисления в CSV' })
  @ApiResponse({
    status: 200,
    description: 'Зачисления успешно экспортированы',
  })
  @ApiResponse({ status: 404, description: 'Зачисления не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async exportCsv(@Res() res: Response) {
    const csv = await this.enrollmentsService.exportEnrollmentsToCsv();
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename=enrollments.csv');
    res.send(csv);
  }

  @Get('test-index/:studentId/:courseId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Тестовый запрос индекса' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'courseId',
    description: 'Идентификатор курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Индекс успешно получен' })
  @ApiResponse({ status: 404, description: 'Индекс не найден' })
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
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Завершить урок и начислить баллы' })
  @ApiResponse({ status: 200, description: 'Урок успешно завершен' })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new ValidationPipe())
  async completeLesson(
    @Body('studentId') studentId: string,
    @Body('courseId') courseId: string,
    @Body('lessonId') lessonId: string,
  ) {
    if (!studentId || !courseId || !lessonId) {
      throw new BadRequestException('Требуются studentId, courseId и lessonId');
    }
    return this.enrollmentsService.completeLesson(
      studentId,
      courseId,
      lessonId,
    );
  }
}
