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
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async createHomework(@Body() createHomeworkDto: CreateHomeworkDto) {
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
  @ApiResponse({
    status: 200,
    description: 'Домашнее задание успешно обновлено',
    type: UpdateHomeworkDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  @UsePipes(new ValidationPipe())
  async updateHomework(
    @Param('id') id: string,
    @Body() updateHomeworkDto: UpdateHomeworkDto,
  ) {
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
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  async deleteHomework(@Param('id') id: string) {
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
  })
  @ApiResponse({ status: 404, description: 'Домашнее задание не найдено' })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findHomeworkById(@Param('id') id: string) {
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
  })
  @ApiResponse({ status: 404, description: 'Домашние задания не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findHomeworksByLesson(@Param('lessonId') lessonId: string) {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('Некорректный идентификатор урока');
    }
    return this.homeworksService.findHomeworksByLesson(lessonId);
  }

  @Post('submissions')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Создать новое решение' })
  @ApiResponse({
    status: 201,
    description: 'Решение успешно создано',
    type: CreateSubmissionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный запрос',
    example: { message: 'Идентификатор домашнего задания невалиден' },
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещён',
    example: { message: 'Требуется роль студента' },
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  @UsePipes(new ValidationPipe())
  async createSubmission(@Body() createSubmissionDto: CreateSubmissionDto) {
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
  @ApiResponse({
    status: 200,
    description: 'Решение успешно обновлено',
    type: UpdateSubmissionDto,
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  @UsePipes(new ValidationPipe())
  async updateSubmission(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ) {
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
  })
  @ApiResponse({ status: 404, description: 'Решение не найдено' })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findSubmissionById(@Param('id') id: string) {
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
  })
  @ApiResponse({ status: 404, description: 'Решения не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findSubmissionsByHomework(@Param('homeworkId') homeworkId: string) {
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
  })
  @ApiResponse({ status: 404, description: 'Решения не найдены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  async findSubmissionsByStudent(@Param('studentId') studentId: string) {
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
    example: { grade: 85, comment: 'Автоматическая проверка: 85%' },
  })
  @ApiResponse({ status: 400, description: 'Некорректный запрос' })
  @ApiResponse({ status: 404, description: 'Решение не найдено' })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER, Role.ASSISTANT)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async autoCheckSubmission(@Body('submissionId') submissionId: string) {
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
