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
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HomeworksService } from './homeworks.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { Types } from 'mongoose';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { IHomework, ISubmission } from './homeworks.service';

@ApiTags('Домашние задания')
@Controller('homeworks')
export class HomeworksController {
  constructor(private readonly homeworksService: HomeworksService) {}

  @Post()
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Создать новое домашнее задание' })
  @ApiResponse({
    status: 201,
    description: 'Домашнее задание успешно создано',
    type: CreateHomeworkDto,
    example: {
      lessonId: '507f1f77bcf86cd799439011',
      description: 'Решить задачи по математике',
      deadline: '2025-03-20T23:59:59Z',
      points: 15,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный формат даты дедлайна' },
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещён',
    example: { message: 'Требуется роль преподавателя или администратора' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async createHomework(
    @Body() createHomeworkDto: CreateHomeworkDto,
  ): Promise<IHomework> {
    try {
      return await this.homeworksService.createHomework(createHomeworkDto);
    } catch (error) {
      throw new BadRequestException('Ошибка при создании домашнего задания');
    }
  }

  @Put(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Обновить домашнее задание' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор домашнего задания',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateHomeworkDto })
  @ApiResponse({
    status: 200,
    description: 'Домашнее задание успешно обновлено',
    type: UpdateHomeworkDto,
    example: {
      description: 'Обновлённое описание задачи',
      points: 20,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный идентификатор домашнего задания' },
  })
  @ApiResponse({
    status: 404,
    description: 'Домашнее задание не найдено',
    example: { message: 'Домашнее задание не найдено' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async updateHomework(
    @Param('id') id: string,
    @Body() updateHomeworkDto: UpdateHomeworkDto,
  ): Promise<IHomework> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }
    try {
      return await this.homeworksService.updateHomework(id, updateHomeworkDto);
    } catch (error) {
      throw new BadRequestException('Ошибка при обновлении домашнего задания');
    }
  }

  @Delete(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Удалить домашнее задание' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор домашнего задания',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Домашнее задание успешно удалено',
    example: { message: 'Домашнее задание успешно удалено' },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный идентификатор домашнего задания' },
  })
  @ApiResponse({
    status: 404,
    description: 'Домашнее задание не найдено',
    example: { message: 'Домашнее задание не найдено' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  async deleteHomework(@Param('id') id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }
    try {
      await this.homeworksService.deleteHomework(id);
      return { message: 'Домашнее задание успешно удалено' };
    } catch (error) {
      throw new BadRequestException('Ошибка при удалении домашнего задания');
    }
  }

  @Get(':id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить домашнее задание по идентификатору' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор домашнего задания',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Домашнее задание успешно получено',
    type: CreateHomeworkDto,
    example: {
      _id: '507f1f77bcf86cd799439011',
      lessonId: '507f1f77bcf86cd799439012',
      description: 'Решить задачи по математике',
      deadline: '2025-03-20T23:59:59Z',
      points: 15,
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Домашнее задание не найдено',
    example: { message: 'Домашнее задание не найдено' },
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещён',
    example: { message: 'Требуется авторизация' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findHomeworkById(@Param('id') id: string): Promise<IHomework | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }
    return this.homeworksService.findHomeworkById(id);
  }

  @Get('lesson/:lessonId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({
    summary: 'Получить домашние задания по идентификатору урока',
  })
  @ApiParam({
    name: 'lessonId',
    description: 'Идентификатор урока',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Домашние задания успешно получены',
    type: [CreateHomeworkDto],
    example: [
      {
        _id: '507f1f77bcf86cd799439011',
        lessonId: '507f1f77bcf86cd799439011',
        description: 'Решить задачи по математике',
        deadline: '2025-03-20T23:59:59Z',
        points: 15,
      },
    ],
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный идентификатор урока' },
  })
  @ApiResponse({
    status: 404,
    description: 'Домашние задания не найдены',
    example: { message: 'Домашние задания не найдены' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findHomeworksByLesson(
    @Param('lessonId') lessonId: string,
  ): Promise<IHomework[]> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('Некорректный идентификатор урока');
    }
    return this.homeworksService.findHomeworksByLesson(lessonId);
  }

  @Post('submissions')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Создать новое решение' })
  @ApiBody({ type: CreateSubmissionDto })
  @ApiResponse({
    status: 201,
    description: 'Решение успешно создано',
    type: CreateSubmissionDto,
    example: {
      homeworkId: '507f1f77bcf86cd799439011',
      studentId: '507f1f77bcf86cd799439012',
      submissionContent: 'Ответы: 1, 2, 3',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный идентификатор домашнего задания' },
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещён',
    example: { message: 'Требуется роль студента' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  @UsePipes(new ValidationPipe())
  async createSubmission(
    @Body() createSubmissionDto: CreateSubmissionDto,
  ): Promise<ISubmission> {
    try {
      return await this.homeworksService.createSubmission(createSubmissionDto);
    } catch (error) {
      throw new BadRequestException('Ошибка при создании решения');
    }
  }

  @Put('submissions/:id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Обновить решение' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор решения',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateSubmissionDto })
  @ApiResponse({
    status: 200,
    description: 'Решение успешно обновлено',
    type: UpdateSubmissionDto,
    example: {
      submissionContent: 'Обновлённые ответы: 1, 2, 3, 4',
      grade: 85,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный идентификатор решения' },
  })
  @ApiResponse({
    status: 404,
    description: 'Решение не найдено',
    example: { message: 'Решение не найдено' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  @UsePipes(new ValidationPipe())
  async updateSubmission(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<ISubmission> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный идентификатор решения');
    }
    try {
      return await this.homeworksService.updateSubmission(
        id,
        updateSubmissionDto,
      );
    } catch (error) {
      throw new BadRequestException('Ошибка при обновлении решения');
    }
  }

  @Get('submissions/:id')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить решение по идентификатору' })
  @ApiParam({
    name: 'id',
    description: 'Идентификатор решения',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Решение успешно получено',
    type: CreateSubmissionDto,
    example: {
      _id: '507f1f77bcf86cd799439011',
      homeworkId: '507f1f77bcf86cd799439011',
      studentId: '507f1f77bcf86cd799439012',
      submissionContent: 'Ответы: 1, 2, 3',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Решение не найдено',
    example: { message: 'Решение не найдено' },
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещён',
    example: { message: 'Требуется авторизация' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findSubmissionById(
    @Param('id') id: string,
  ): Promise<ISubmission | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Некорректный идентификатор решения');
    }
    return this.homeworksService.findSubmissionById(id);
  }

  @Get('submissions/homework/:homeworkId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({
    summary: 'Получить решения по идентификатору домашнего задания',
  })
  @ApiParam({
    name: 'homeworkId',
    description: 'Идентификатор домашнего задания',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Решения успешно получены',
    type: [CreateSubmissionDto],
    example: [
      {
        _id: '507f1f77bcf86cd799439011',
        homeworkId: '507f1f77bcf86cd799439011',
        studentId: '507f1f77bcf86cd799439012',
        submissionContent: 'Ответы: 1, 2, 3',
      },
    ],
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный идентификатор домашнего задания' },
  })
  @ApiResponse({
    status: 404,
    description: 'Решения не найдены',
    example: { message: 'Решения не найдены' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findSubmissionsByHomework(
    @Param('homeworkId') homeworkId: string,
  ): Promise<ISubmission[]> {
    if (!Types.ObjectId.isValid(homeworkId)) {
      throw new BadRequestException(
        'Некорректный идентификатор домашнего задания',
      );
    }
    return this.homeworksService.findSubmissionsByHomework(homeworkId);
  }

  @Get('submissions/student/:studentId')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Получить решения по идентификатору студента' })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Решения успешно получены',
    type: [CreateSubmissionDto],
    example: [
      {
        _id: '507f1f77bcf86cd799439011',
        homeworkId: '507f1f77bcf86cd799439011',
        studentId: '507f1f77bcf86cd799439011',
        submissionContent: 'Ответы: 1, 2, 3',
      },
    ],
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный идентификатор студента' },
  })
  @ApiResponse({
    status: 404,
    description: 'Решения не найдены',
    example: { message: 'Решения не найдены' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findSubmissionsByStudent(
    @Param('studentId') studentId: string,
  ): Promise<ISubmission[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Некорректный идентификатор студента');
    }
    return this.homeworksService.findSubmissionsByStudent(studentId);
  }

  @Post('submissions/auto-check')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Автоматическая проверка решения' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        submissionId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
          description: 'Идентификатор решения для проверки',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Решение успешно проверено автоматически',
    type: Object,
    example: {
      grade: 85,
      comment: 'Автопроверка: 85% на основе 8 правильных ответов из 10',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Некорректный идентификатор решения' },
  })
  @ApiResponse({
    status: 404,
    description: 'Решение не найдено',
    example: { message: 'Решение не найдено' },
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещён',
    example: { message: 'Требуется роль преподавателя или администратора' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async autoCheckSubmission(
    @Body('submissionId') submissionId: string,
  ): Promise<{ grade: number; comment: string }> {
    if (!Types.ObjectId.isValid(submissionId)) {
      throw new BadRequestException('Некорректный идентификатор решения');
    }
    try {
      return await this.homeworksService.autoCheckSubmission(submissionId);
    } catch (error) {
      throw new BadRequestException(
        'Ошибка при автоматической проверке решения',
      );
    }
  }
}
