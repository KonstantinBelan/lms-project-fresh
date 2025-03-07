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
import { Types } from 'mongoose'; // Импортируем Types для проверки ObjectId
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Homeworks')
@Controller('homeworks')
export class HomeworksController {
  constructor(private readonly homeworksService: HomeworksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new homework' })
  @ApiResponse({
    status: 201,
    description: 'Homework created',
    type: CreateHomeworkDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createHomework(@Body() createHomeworkDto: CreateHomeworkDto) {
    return this.homeworksService.createHomework(createHomeworkDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update homework' })
  @ApiParam({
    name: 'id',
    description: 'Homework ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Homework updated',
    type: UpdateHomeworkDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async updateHomework(
    @Param('id') id: string,
    @Body() updateHomeworkDto: UpdateHomeworkDto,
  ) {
    return this.homeworksService.updateHomework(id, updateHomeworkDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete homework' })
  @ApiParam({
    name: 'id',
    description: 'Homework ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Homework deleted',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  async deleteHomework(@Param('id') id: string) {
    return this.homeworksService.deleteHomework(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get homework by ID' })
  @ApiParam({
    name: 'id',
    description: 'Homework ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Homework retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Homework not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findHomeworkById(@Param('id') id: string) {
    return this.homeworksService.findHomeworkById(id);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get homeworks by lesson ID' })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Homeworks retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Homeworks not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findHomeworksByLesson(@Param('lessonId') lessonId: string) {
    return this.homeworksService.findHomeworksByLesson(lessonId);
  }

  @Post('submissions')
  @ApiOperation({ summary: 'Create a new submission' })
  @ApiResponse({
    status: 201,
    description: 'Submission created',
    type: CreateSubmissionDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT])
  @UsePipes(new ValidationPipe())
  async createSubmission(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.homeworksService.createSubmission(createSubmissionDto);
  }

  @Put('submissions/:id')
  @ApiOperation({ summary: 'Update submission' })
  @ApiParam({
    name: 'id',
    description: 'Submission ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission updated',
    type: UpdateSubmissionDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  @UsePipes(new ValidationPipe())
  async updateSubmission(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ) {
    return this.homeworksService.updateSubmission(id, updateSubmissionDto);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get submission by ID' })
  @ApiParam({
    name: 'id',
    description: 'Submission ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findSubmissionById(@Param('id') id: string) {
    return this.homeworksService.findSubmissionById(id);
  }

  @Get('submissions/homework/:homeworkId')
  @ApiOperation({ summary: 'Get submissions by homework ID' })
  @ApiParam({
    name: 'homeworkId',
    description: 'Homework ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissions retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Submissions not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findSubmissionsByHomework(@Param('homeworkId') homeworkId: string) {
    return this.homeworksService.findSubmissionsByHomework(homeworkId);
  }

  @Get('submissions/student/:studentId')
  @ApiOperation({ summary: 'Get submissions by student ID' })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissions retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Submissions not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.STUDENT,
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ])
  async findSubmissionsByStudent(@Param('studentId') studentId: string) {
    return this.homeworksService.findSubmissionsByStudent(studentId);
  }

  // Обновлённый роут для автоматической проверки решений с улучшенной валидацией submissionId
  @Post('submissions/auto-check')
  @ApiOperation({ summary: 'Auto-check submission' })
  @ApiResponse({
    status: 200,
    description: 'Submission auto-checked successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [
    Role.TEACHER,
    Role.ADMIN,
    Role.MANAGER,
    Role.ASSISTANT,
  ]) // Ограничение доступа для учителей и администраторов
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) // Улучшаем валидацию
  async autoCheckSubmission(@Body('submissionId') submissionId: string) {
    // Валидация submissionId как ObjectId
    if (!Types.ObjectId.isValid(submissionId)) {
      throw new BadRequestException(
        'Invalid submissionId: must be a valid ObjectId',
      );
    }
    return this.homeworksService.autoCheckSubmission(submissionId);
  }
}
