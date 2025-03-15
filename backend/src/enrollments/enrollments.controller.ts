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
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { EnrollmentDocument } from './schemas/enrollment.schema';
import { Types } from 'mongoose';
import { Logger } from '@nestjs/common';

// DTO для ответа с данными о зачислении
class EnrollmentResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Идентификатор зачисления',
  })
  id: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Идентификатор студента',
  })
  studentId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439013',
    description: 'Идентификатор курса',
  })
  courseId: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439014'],
    description: 'Список завершенных модулей',
  })
  completedModules: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439015'],
    description: 'Список завершенных уроков',
  })
  completedLessons: string[];

  @ApiProperty({ example: false, description: 'Завершен ли курс' })
  isCompleted: boolean;

  @ApiProperty({
    example: 85,
    description: 'Оценка за курс (опционально)',
    required: false,
  })
  grade?: number;

  @ApiProperty({
    example: '2025-03-15T00:00:00Z',
    description: 'Дедлайн (опционально)',
    required: false,
  })
  deadline?: string;

  @ApiProperty({ example: 50, description: 'Количество баллов' })
  points: number;
}

// Маппер для преобразования EnrollmentDocument в EnrollmentResponseDto
function mapToEnrollmentResponse(
  enrollment: EnrollmentDocument,
): EnrollmentResponseDto {
  return {
    id: enrollment._id.toString(),
    studentId: enrollment.studentId.toString(),
    courseId: enrollment.courseId.toString(),
    completedModules: enrollment.completedModules.map((id) => id.toString()),
    completedLessons: enrollment.completedLessons.map((id) => id.toString()),
    isCompleted: enrollment.isCompleted,
    grade: enrollment.grade,
    deadline: enrollment.deadline?.toISOString(),
    points: enrollment.points,
  };
}

@ApiTags('Зачисления')
@Controller('enrollments')
@Catch(AlreadyEnrolledException)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiSecurity('JWT-auth')
export class EnrollmentsController {
  private readonly logger = new Logger(EnrollmentsController.name);

  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Создать новое зачисление' })
  @ApiResponse({
    status: 201,
    description: 'Зачисление успешно создано',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @ApiResponse({ status: 409, description: 'Студент уже зачислен' })
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    try {
      this.logger.debug(
        `Создание зачисления: ${JSON.stringify(createEnrollmentDto)}`,
      );
      const deadline = createEnrollmentDto.deadline
        ? new Date(createEnrollmentDto.deadline)
        : undefined;
      if (deadline && isNaN(deadline.getTime())) {
        throw new BadRequestException('Некорректный формат даты дедлайна');
      }
      const enrollment = await this.enrollmentsService.createEnrollment(
        createEnrollmentDto.studentId,
        createEnrollmentDto.courseId,
        deadline,
        createEnrollmentDto.streamId,
        createEnrollmentDto.tariffId,
      );
      return mapToEnrollmentResponse(enrollment);
    } catch (error) {
      if (error instanceof AlreadyEnrolledException) {
        throw error;
      }
      this.logger.error(`Ошибка при создании зачисления: ${error.message}`);
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
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Создать массовые зачисления' })
  @ApiResponse({
    status: 201,
    description: 'Зачисления успешно созданы',
    type: [EnrollmentResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UsePipes(new ValidationPipe())
  async createBatch(
    @Body() batchEnrollmentDto: BatchEnrollmentDto,
  ): Promise<EnrollmentResponseDto[]> {
    this.logger.debug(
      `Массовое создание зачислений: ${JSON.stringify(batchEnrollmentDto)}`,
    );
    const enrollments =
      await this.enrollmentsService.createBatchEnrollments(batchEnrollmentDto);
    return enrollments.map(mapToEnrollmentResponse);
  }

  @Get('student/:studentId')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  @ApiOperation({ summary: 'Получить зачисления по идентификатору студента' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Зачисления успешно получены',
    type: [EnrollmentResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Некорректный studentId' })
  async findByStudent(
    @Param('studentId') studentId: string,
  ): Promise<EnrollmentResponseDto[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Некорректный studentId');
    }
    this.logger.debug(`Поиск зачислений для студента ${studentId}`);
    const enrollments =
      await this.enrollmentsService.findEnrollmentsByStudent(studentId);
    return enrollments.map(mapToEnrollmentResponse);
  }

  @Get('student/:studentId/course/:courseId/progress')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  @ApiOperation({ summary: 'Получить прогресс студента по курсу' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'courseId',
    description: 'Идентификатор курса',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Прогресс успешно получен',
    type: 'StudentProgress', // Предполагается, что StudentProgress определен в другом месте
  })
  @ApiResponse({ status: 400, description: 'Некорректные параметры' })
  async getStudentProgress(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Некорректный studentId или courseId');
    }
    this.logger.debug(
      `Получение прогресса для студента ${studentId} по курсу ${courseId}`,
    );
    return this.enrollmentsService.getStudentProgress(studentId, courseId);
  }

  @Get('student/:studentId/detailed-progress')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  @ApiOperation({ summary: 'Получить детальный прогресс студента' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Детальный прогресс успешно получен',
    type: 'DetailedStudentProgress', // Предполагается, что определен в интерфейсе
  })
  @ApiResponse({ status: 400, description: 'Некорректный studentId' })
  async getDetailedStudentProgress(@Param('studentId') studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Некорректный studentId');
    }
    this.logger.debug(
      `Получение детального прогресса для студента ${studentId}`,
    );
    return this.enrollmentsService.getDetailedStudentProgress(studentId);
  }

  @Get('course/:courseId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Получить зачисления по идентификатору курса' })
  @ApiParam({
    name: 'courseId',
    description: 'Идентификатор курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Зачисления успешно получены',
    type: [EnrollmentResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Некорректный courseId' })
  async getCourseEnrollments(
    @Param('courseId') courseId: string,
  ): Promise<EnrollmentResponseDto[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Некорректный courseId');
    }
    this.logger.debug(`Поиск зачислений для курса ${courseId}`);
    const enrollments =
      await this.enrollmentsService.findEnrollmentsByCourse(courseId);
    return enrollments.map((enrollment: any) => ({
      id: enrollment.studentId,
      studentId: enrollment.studentId,
      courseId,
      completedModules: enrollment.completedModules,
      completedLessons: enrollment.completedLessons,
      isCompleted: enrollment.isCompleted,
      grade: enrollment.grade,
      deadline: enrollment.deadline,
      points: enrollment.points,
    }));
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  @ApiOperation({ summary: 'Получить зачисление по идентификатору' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор зачисления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Зачисление найдено',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Зачисление не найдено' })
  async findOne(@Param('id') id: string): Promise<EnrollmentResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный id');
    }
    this.logger.debug(`Поиск зачисления по ID ${id}`);
    const enrollment = await this.enrollmentsService.findEnrollmentById(id);
    if (!enrollment) throw new BadRequestException('Зачисление не найдено');
    return mapToEnrollmentResponse(enrollment);
  }

  @Put(':id/progress')
  @Roles(Role.STUDENT, Role.ASSISTANT)
  @ApiOperation({ summary: 'Обновить прогресс студента' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор зачисления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Прогресс обновлен',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Зачисление не найдено' })
  @UsePipes(new ValidationPipe())
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ): Promise<EnrollmentResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный id');
    }
    this.logger.debug(`Обновление прогресса для зачисления ${id}`);
    const enrollment = await this.enrollmentsService.findEnrollmentById(id);
    if (!enrollment) throw new BadRequestException('Зачисление не найдено');
    const updatedEnrollment =
      await this.enrollmentsService.updateStudentProgress(
        enrollment.studentId.toString(),
        enrollment.courseId.toString(),
        updateProgressDto.moduleId,
        updateProgressDto.lessonId,
      );
    if (!updatedEnrollment)
      throw new BadRequestException('Не удалось обновить прогресс');
    return mapToEnrollmentResponse(updatedEnrollment);
  }

  @Put(':id/complete')
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Завершить курс' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор зачисления',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Курс завершен',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Зачисление не найдено' })
  @UsePipes(new ValidationPipe())
  async completeCourse(
    @Param('id') id: string,
    @Body() completeCourseDto: CompleteCourseDto,
  ): Promise<EnrollmentResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный id');
    }
    this.logger.debug(`Завершение курса для зачисления ${id}`);
    const enrollment = await this.enrollmentsService.completeCourse(
      id,
      completeCourseDto.grade,
    );
    if (!enrollment) throw new BadRequestException('Зачисление не найдено');
    return mapToEnrollmentResponse(enrollment);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
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
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный id');
    }
    this.logger.debug(`Удаление зачисления ${id}`);
    await this.enrollmentsService.deleteEnrollment(id);
    return { message: 'Зачисление удалено' };
  }

  @Get('export/csv')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Экспортировать зачисления в CSV' })
  @ApiResponse({
    status: 200,
    description: 'Зачисления успешно экспортированы',
    schema: {
      type: 'string',
      example:
        'studentId,courseId,points\n507f1f77bcf86cd799439011,507f1f77bcf86cd799439012,50',
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async exportCsv(@Res() res: Response) {
    this.logger.debug('Экспорт зачислений в CSV');
    const csv = await this.enrollmentsService.exportEnrollmentsToCsv();
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename=enrollments.csv');
    res.send(csv);
  }

  @Get('test-index/:studentId/:courseId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Тестовый запрос индекса' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'courseId',
    description: 'Идентификатор курса',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Индекс успешно получен',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Зачисление не найдено' })
  async testIndex(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ): Promise<EnrollmentResponseDto | null> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId)
    ) {
      throw new BadRequestException('Некорректный studentId или courseId');
    }
    this.logger.debug(`Тестовый запрос индекса для ${studentId} и ${courseId}`);
    const enrollment =
      await this.enrollmentsService.findEnrollmentByStudentAndCourse(
        studentId,
        courseId,
      );
    return enrollment ? mapToEnrollmentResponse(enrollment) : null;
  }

  @Post('lesson/complete')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Завершить урок и начислить баллы' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        courseId: { type: 'string', example: '507f1f77bcf86cd799439012' },
        lessonId: { type: 'string', example: '507f1f77bcf86cd799439013' },
      },
      required: ['studentId', 'courseId', 'lessonId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Урок успешно завершен',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UsePipes(new ValidationPipe())
  async completeLesson(
    @Body('studentId') studentId: string,
    @Body('courseId') courseId: string,
    @Body('lessonId') lessonId: string,
  ): Promise<EnrollmentResponseDto> {
    if (
      !Types.ObjectId.isValid(studentId) ||
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      throw new BadRequestException(
        'Некорректный studentId, courseId или lessonId',
      );
    }
    this.logger.debug(
      `Завершение урока ${lessonId} для студента ${studentId} на курсе ${courseId}`,
    );
    const enrollment = await this.enrollmentsService.completeLesson(
      studentId,
      courseId,
      lessonId,
    );
    return mapToEnrollmentResponse(enrollment);
  }
}
