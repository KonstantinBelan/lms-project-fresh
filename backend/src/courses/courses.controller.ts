import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Res,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
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
import { JwtRequest } from '../common/interfaces/jwt-request.interface';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Course } from './schemas/course.schema';
import { Module } from './schemas/module.schema';
import { Lesson } from './schemas/lesson.schema';
import { Types } from 'mongoose';

// Теги Swagger для группировки эндпоинтов
@ApiTags('Курсы')
@Controller('courses')
@ApiBearerAuth('JWT-auth') // Требуется JWT-токен для всех эндпоинтов
export class CoursesController {
  private readonly logger = new Logger(CoursesController.name);

  constructor(private readonly coursesService: CoursesService) {}

  // Создание нового курса
  @Post()
  @ApiOperation({ summary: 'Создать новый курс' })
  @ApiResponse({
    status: 201,
    description: 'Курс успешно создан',
    type: Course,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос',
    schema: { example: { message: 'Неверные данные' } },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async create(@Body() createCourseDto: CreateCourseDto): Promise<Course> {
    this.logger.log(`Создание курса: ${createCourseDto.title}`);
    return this.coursesService.createCourse(createCourseDto);
  }

  // Пакетное создание курсов
  @Post('batch')
  @ApiOperation({ summary: 'Создать несколько курсов' })
  @ApiResponse({
    status: 201,
    description: 'Курсы успешно созданы',
    type: [Course],
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос',
    schema: { example: { message: 'Неверные данные' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async createBatch(@Body() batchCourseDto: BatchCourseDto): Promise<Course[]> {
    this.logger.log(
      `Создание нескольких курсов: ${batchCourseDto.courses.length} шт.`,
    );
    return this.coursesService.createBatchCourses(batchCourseDto);
  }

  // Получение всех курсов с пагинацией
  @Get()
  @ApiOperation({ summary: 'Получить все курсы' })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Сколько курсов пропустить',
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Максимальное количество курсов',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Курсы успешно получены',
    schema: {
      type: 'object',
      properties: {
        courses: {
          type: 'array',
          items: { $ref: '#/components/schemas/Course' },
        },
        total: { type: 'number', example: 100 },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER, Role.STUDENT, Role.ASSISTANT)
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ courses: Course[]; total: number }> {
    this.logger.log(
      `Получение списка всех курсов: skip=${skip}, limit=${limit}`,
    );
    return this.coursesService.findAllCourses(skip, limit);
  }

  // Получение курса по ID
  @Get(':id')
  @ApiOperation({ summary: 'Получить курс по ID' })
  @ApiParam({
    name: 'id',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Курс найден', type: Course })
  @ApiResponse({
    status: 404,
    description: 'Курс не найден',
    schema: { example: { message: 'Курс не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER, Role.STUDENT, Role.ASSISTANT)
  async findOne(@Param('id') id: string): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Неверный ID курса: ${id}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(`Поиск курса с ID: ${id}`);
    return this.coursesService.findCourseById(id);
  }

  // Получение структуры курса
  @Get(':courseId/structure')
  @ApiOperation({ summary: 'Получить структуру курса' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Структура курса успешно получена',
    schema: {
      example: {
        courseId: '507f1f77bcf86cd799439011',
        title: 'Курс',
        modules: [],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Курс не найден',
    schema: { example: { message: 'Курс не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER, Role.STUDENT, Role.ASSISTANT)
  async courseStructure(@Param('courseId') courseId: string): Promise<any> {
    if (!Types.ObjectId.isValid(courseId)) {
      this.logger.warn(`Неверный ID курса: ${courseId}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(`Получение структуры курса с ID: ${courseId}`);
    return this.coursesService.getCourseStructure(courseId);
  }

  // Получение структуры курса для студента
  @Get(':courseId/student-structure')
  @ApiOperation({
    summary: 'Получить структуру курса для студента с учетом тарифа',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Структура курса для студента успешно получена',
    schema: {
      example: {
        courseId: '507f1f77bcf86cd799439011',
        title: 'Курс',
        modules: [],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Курс или запись о зачислении не найдены',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async getStudentCourseStructure(
    @Param('courseId') courseId: string,
    @Req() req: JwtRequest,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(courseId)) {
      this.logger.warn(`Неверный ID курса: ${courseId}`);
      throw new BadRequestException('Неверный ID курса');
    }
    const studentId = req.user?.sub || req.user?._id;
    if (!studentId) {
      this.logger.error('Отсутствует ID студента в токене', req.user);
      throw new UnauthorizedException('ID студента не найден в токене');
    }
    this.logger.log(
      `Получение структуры курса ${courseId} для студента ${studentId}`,
    );
    return this.coursesService.getStudentCourseStructure(studentId, courseId);
  }

  // Обновление курса
  @Put(':id')
  @ApiOperation({ summary: 'Обновить курс' })
  @ApiParam({
    name: 'id',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Курс обновлен', type: Course })
  @ApiResponse({
    status: 404,
    description: 'Курс не найден',
    schema: { example: { message: 'Курс не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<Course> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Неверный ID курса: ${id}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(`Обновление курса с ID: ${id}`);
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  // Удаление курса
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить курс' })
  @ApiParam({
    name: 'id',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Курс удален',
    schema: { example: { message: 'Курс удален' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Курс не найден',
    schema: { example: { message: 'Курс не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Неверный ID курса: ${id}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(`Удаление курса с ID: ${id}`);
    await this.coursesService.deleteCourse(id);
    return { message: 'Курс удален' };
  }

  // Создание модуля
  @Post(':courseId/modules')
  @ApiOperation({ summary: 'Создать новый модуль' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 201, description: 'Модуль создан', type: Module })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос',
    schema: { example: { message: 'Неверные данные' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async createModule(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ): Promise<Module> {
    if (!Types.ObjectId.isValid(courseId)) {
      this.logger.warn(`Неверный ID курса: ${courseId}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(`Создание модуля для курса ${courseId}`);
    return this.coursesService.createModule(courseId, createModuleDto);
  }

  // Получение модуля по ID
  @Get(':courseId/modules/:moduleId')
  @ApiOperation({ summary: 'Получить модуль по ID' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID модуля',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({ status: 200, description: 'Модуль найден', type: Module })
  @ApiResponse({
    status: 404,
    description: 'Модуль или курс не найден',
    schema: { example: { message: 'Модуль не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER, Role.STUDENT, Role.ASSISTANT)
  async findModule(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
  ): Promise<Module> {
    if (
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId)
    ) {
      this.logger.warn(
        `Неверный ID курса (${courseId}) или модуля (${moduleId})`,
      );
      throw new BadRequestException('Неверный ID курса или модуля');
    }
    this.logger.log(`Поиск модуля ${moduleId} в курсе ${courseId}`);
    await this.coursesService.findCourseById(courseId); // Проверка существования курса
    const module = await this.coursesService.findModuleById(moduleId);
    if (!module) {
      this.logger.warn(`Модуль с ID ${moduleId} не найден`);
      throw new NotFoundException(`Модуль с ID ${moduleId} не найден`);
    }
    return module;
  }

  // Создание урока
  @Post(':courseId/modules/:moduleId/lessons')
  @ApiOperation({ summary: 'Создать новый урок' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID модуля',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({ status: 201, description: 'Урок создан', type: Lesson })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос',
    schema: { example: { message: 'Неверные данные' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER, Role.ASSISTANT)
  @UsePipes(new ValidationPipe())
  async createLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    if (
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId)
    ) {
      this.logger.warn(
        `Неверный ID курса (${courseId}) или модуля (${moduleId})`,
      );
      throw new BadRequestException('Неверный ID курса или модуля');
    }
    this.logger.log(
      `Создание урока для модуля ${moduleId} в курсе ${courseId}`,
    );
    return this.coursesService.createLesson(
      courseId,
      moduleId,
      createLessonDto,
    );
  }

  // Получение урока по ID
  @Get(':courseId/modules/:moduleId/lessons/:lessonId')
  @ApiOperation({ summary: 'Получить урок по ID' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID модуля',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'ID урока',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({ status: 200, description: 'Урок найден', type: Lesson })
  @ApiResponse({
    status: 404,
    description: 'Урок, модуль или курс не найдены',
    schema: { example: { message: 'Урок не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN, Role.TEACHER, Role.MANAGER, Role.ASSISTANT)
  async findLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<Lesson> {
    if (
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      this.logger.warn(
        `Неверный ID курса (${courseId}), модуля (${moduleId}) или урока (${lessonId})`,
      );
      throw new BadRequestException('Неверный ID курса, модуля или урока');
    }
    this.logger.log(
      `Поиск урока ${lessonId} в модуле ${moduleId} курса ${courseId}`,
    );
    await this.coursesService.findCourseById(courseId); // Проверка курса
    await this.coursesService.findModuleById(moduleId); // Проверка модуля
    const lesson = await this.coursesService.findLessonById(lessonId);
    if (!lesson) {
      this.logger.warn(`Урок с ID ${lessonId} не найден`);
      throw new NotFoundException(`Урок с ID ${lessonId} не найден`);
    }
    return lesson;
  }

  // Получение статистики курса
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Получить статистику курса' })
  @ApiParam({
    name: 'id',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика курса успешно получена',
    schema: {
      example: {
        courseId: '507f1f77bcf86cd799439011',
        totalModules: 2,
        totalLessons: 5,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Курс не найден',
    schema: { example: { message: 'Курс не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER)
  async getCourseStatistics(@Param('id') courseId: string): Promise<any> {
    if (!Types.ObjectId.isValid(courseId)) {
      this.logger.warn(`Неверный ID курса: ${courseId}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(`Получение статистики курса ${courseId}`);
    return this.coursesService.getCourseStatistics(courseId);
  }

  // Обновление урока
  @Put(':courseId/modules/:moduleId/lessons/:lessonId')
  @ApiOperation({ summary: 'Обновить урок' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID модуля',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'ID урока',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({ status: 200, description: 'Урок обновлен', type: Lesson })
  @ApiResponse({
    status: 404,
    description: 'Урок не найден',
    schema: { example: { message: 'Урок не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe())
  async updateLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: CreateLessonDto,
  ): Promise<Lesson> {
    if (
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      this.logger.warn(
        `Неверный ID курса (${courseId}), модуля (${moduleId}) или урока (${lessonId})`,
      );
      throw new BadRequestException('Неверный ID курса, модуля или урока');
    }
    this.logger.log(
      `Обновление урока ${lessonId} в модуле ${moduleId} курса ${courseId}`,
    );
    const updatedLesson = await this.coursesService.updateLesson(
      courseId,
      moduleId,
      lessonId,
      updateLessonDto,
    );
    if (!updatedLesson) {
      this.logger.warn(`Урок с ID ${lessonId} не найден`);
      throw new NotFoundException(`Урок с ID ${lessonId} не найден`);
    }
    return updatedLesson;
  }

  // Удаление урока
  @Delete(':courseId/modules/:moduleId/lessons/:lessonId')
  @ApiOperation({ summary: 'Удалить урок' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'moduleId',
    description: 'ID модуля',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'ID урока',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Урок удален',
    schema: { example: { message: 'Урок удален' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Урок не найден',
    schema: { example: { message: 'Урок не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async deleteLesson(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<{ message: string }> {
    if (
      !Types.ObjectId.isValid(courseId) ||
      !Types.ObjectId.isValid(moduleId) ||
      !Types.ObjectId.isValid(lessonId)
    ) {
      this.logger.warn(
        `Неверный ID курса (${courseId}), модуля (${moduleId}) или урока (${lessonId})`,
      );
      throw new BadRequestException('Неверный ID курса, модуля или урока');
    }
    this.logger.log(
      `Удаление урока ${lessonId} из модуля ${moduleId} курса ${courseId}`,
    );
    await this.coursesService.deleteLesson(courseId, moduleId, lessonId);
    return { message: 'Урок удален' };
  }

  // Получение аналитики курса
  @Get(':courseId/analytics')
  @ApiOperation({ summary: 'Получить аналитику курса' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Аналитика курса успешно получена',
    schema: { example: { totalStudents: 10, completionRate: 50 } },
  })
  @ApiResponse({
    status: 404,
    description: 'Курс не найден',
    schema: { example: { message: 'Курс не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async getCourseAnalytics(@Param('courseId') courseId: string): Promise<any> {
    if (!Types.ObjectId.isValid(courseId)) {
      this.logger.warn(`Неверный ID курса: ${courseId}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(`Получение аналитики курса ${courseId}`);
    return this.coursesService.getCourseAnalytics(courseId);
  }

  // Экспорт аналитики в CSV
  @Get(':courseId/export/csv')
  @ApiOperation({ summary: 'Экспортировать аналитику курса в CSV' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Аналитика курса успешно экспортирована',
    type: 'file',
  })
  @ApiResponse({
    status: 404,
    description: 'Курс не найден',
    schema: { example: { message: 'Курс не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async exportCourseAnalytics(
    @Param('courseId') courseId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(courseId)) {
      this.logger.warn(`Неверный ID курса: ${courseId}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(`Экспорт аналитики курса ${courseId} в CSV`);
    const filePath =
      await this.coursesService.exportCourseAnalyticsToCSV(courseId);
    res.download(filePath);
  }

  // Получение таблицы лидеров
  @Get(':courseId/leaderboard')
  @ApiOperation({ summary: 'Получить таблицу лидеров курса' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество записей для возврата',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Таблица лидеров успешно получена',
    type: [LeaderboardEntry],
  })
  @ApiResponse({
    status: 404,
    description: 'Курс не найден',
    schema: { example: { message: 'Курс не найден' } },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER, Role.MANAGER, Role.STUDENT, Role.ASSISTANT)
  async getLeaderboard(
    @Param('courseId') courseId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<LeaderboardEntry[]> {
    if (!Types.ObjectId.isValid(courseId)) {
      this.logger.warn(`Неверный ID курса: ${courseId}`);
      throw new BadRequestException('Неверный ID курса');
    }
    this.logger.log(
      `Получение таблицы лидеров для курса ${courseId} с лимитом ${limit}`,
    );
    return this.coursesService.getLeaderboard(courseId, limit);
  }
}
