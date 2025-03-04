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

@Controller('homeworks')
export class HomeworksController {
  constructor(private readonly homeworksService: HomeworksService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  @UsePipes(new ValidationPipe())
  async createHomework(@Body() createHomeworkDto: CreateHomeworkDto) {
    return this.homeworksService.createHomework(createHomeworkDto);
  }

  @Put(':id')
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  async deleteHomework(@Param('id') id: string) {
    return this.homeworksService.deleteHomework(id);
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
  async findHomeworkById(@Param('id') id: string) {
    return this.homeworksService.findHomeworkById(id);
  }

  @Get('lesson/:lessonId')
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.STUDENT])
  @UsePipes(new ValidationPipe())
  async createSubmission(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.homeworksService.createSubmission(createSubmissionDto);
  }

  @Put('submissions/:id')
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
