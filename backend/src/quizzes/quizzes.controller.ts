import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  SetMetadata,
  UsePipes,
  ValidationPipe,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuizzesService } from './quizzes.service';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Cache } from 'cache-manager';

@ApiTags('Викторины')
@Controller('quizzes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class QuizzesController {
  private readonly logger = new Logger(QuizzesController.name);

  constructor(private quizzesService: QuizzesService) {}

  @Post()
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Создать новую викторину' })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({
    status: 201,
    description: 'Викторина успешно создана',
    type: CreateQuizDto,
    schema: {
      example: {
        lessonId: '67c848293c783d942cafb836',
        title: 'Основы математики',
        questions: [{ question: 'Что такое 1+1?', correctAnswers: [1] }],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - отсутствуют обязательные поля',
    schema: { example: { message: 'Требуются lessonId, title и вопросы' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - недостаточно прав',
  })
  @ApiSecurity('JWT-auth')
  async createQuiz(@Body() body: CreateQuizDto) {
    const { lessonId, title, questions, timeLimit } = body;

    if (!lessonId || !title || !questions?.length) {
      this.logger.warn(`Неверные данные: ${JSON.stringify(body)}`);
      throw new BadRequestException('Требуются lessonId, title и вопросы');
    }

    this.logger.log(`Создание викторины для урока ${lessonId}: "${title}"`);
    const quiz = await this.quizzesService.createQuiz(
      lessonId,
      title,
      questions,
      timeLimit,
    );
    this.logger.log(`Викторина создана: ${quiz._id?.toString() || 'unknown'}`);
    return quiz;
  }

  @Get(':quizId')
  @ApiOperation({ summary: 'Получить викторину по ID' })
  @ApiParam({ name: 'quizId', description: 'ID викторины' })
  @ApiResponse({
    status: 200,
    description: 'Викторина успешно найдена',
    type: CreateQuizDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Викторина не найдена',
    schema: { example: { message: 'Викторина с ID не найдена' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - отсутствует quizId',
  })
  @ApiSecurity('JWT-auth')
  async findQuizById(@Param('quizId') quizId: string) {
    if (!quizId) {
      this.logger.warn('Отсутствует quizId');
      throw new BadRequestException('Требуется quizId');
    }

    this.logger.log(`Поиск викторины: ${quizId}`);
    const quiz = await this.quizzesService.findQuizById(quizId);
    if (!quiz) {
      this.logger.warn(`Викторина ${quizId} не найдена`);
      throw new NotFoundException(`Викторина с ID ${quizId} не найдена`);
    }
    return quiz;
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Получить викторины по ID урока' })
  @ApiParam({ name: 'lessonId', description: 'ID урока' })
  @ApiResponse({
    status: 200,
    description: 'Викторины найдены',
    type: [CreateQuizDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Викторины для урока не найдены',
    schema: { example: [] },
  })
  @ApiSecurity('JWT-auth')
  async findQuizzesByLesson(@Param('lessonId') lessonId: string) {
    if (!lessonId) {
      this.logger.warn('Отсутствует lessonId');
      throw new BadRequestException('Требуется lessonId');
    }

    this.logger.log(`Поиск викторин для урока: ${lessonId}`);
    const quizzes = await this.quizzesService.findQuizzesByLesson(lessonId);
    return quizzes;
  }

  @Put(':quizId')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Обновить викторину' })
  @ApiParam({ name: 'quizId', description: 'ID викторины' })
  @ApiBody({ type: CreateQuizDto })
  @ApiResponse({
    status: 200,
    description: 'Викторина обновлена',
    type: CreateQuizDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Викторина не найдена',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - нет данных для обновления',
  })
  @ApiSecurity('JWT-auth')
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() body: Partial<CreateQuizDto>,
  ) {
    if (!quizId) {
      this.logger.warn('Отсутствует quizId');
      throw new BadRequestException('Требуется quizId');
    }

    if (Object.keys(body).length === 0) {
      this.logger.warn('Нет данных для обновления');
      throw new BadRequestException('Требуются данные для обновления');
    }

    this.logger.log(`Обновление викторины ${quizId}: ${JSON.stringify(body)}`);
    const updatedQuiz = await this.quizzesService.updateQuiz(quizId, body);
    if (!updatedQuiz) {
      this.logger.warn(`Викторина ${quizId} не найдена`);
      throw new NotFoundException(`Викторина с ID ${quizId} не найдена`);
    }
    return updatedQuiz;
  }

  @Delete(':quizId')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @ApiOperation({ summary: 'Удалить викторину' })
  @ApiParam({ name: 'quizId', description: 'ID викторины' })
  @ApiResponse({
    status: 200,
    description: 'Викторина удалена',
    schema: { example: { message: 'Викторина удалена' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Викторина не найдена',
  })
  @ApiSecurity('JWT-auth')
  async deleteQuiz(@Param('quizId') quizId: string) {
    if (!quizId) {
      this.logger.warn('Отсутствует quizId');
      throw new BadRequestException('Требуется quizId');
    }

    this.logger.log(`Удаление викторины: ${quizId}`);
    await this.quizzesService.deleteQuiz(quizId);
    return { message: 'Викторина удалена' };
  }

  @Post(':quizId/submit')
  @SetMetadata('roles', [Role.ADMIN, Role.STUDENT])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Отправить ответы на викторину' })
  @ApiParam({ name: 'quizId', description: 'ID викторины' })
  @ApiBody({ type: SubmitQuizDto })
  @ApiResponse({
    status: 201,
    description: 'Ответы отправлены',
    type: SubmitQuizDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - отсутствуют данные',
  })
  @ApiSecurity('JWT-auth')
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() body: SubmitQuizDto,
  ) {
    const { studentId, answers } = body;

    if (!quizId || !studentId || !answers?.length) {
      this.logger.warn(`Неверные данные: ${JSON.stringify(body)}`);
      throw new BadRequestException('Требуются quizId, studentId и ответы');
    }

    this.logger.log(`Отправка викторины ${quizId} студентом ${studentId}`);
    const submission = await this.quizzesService.submitQuiz(
      studentId,
      quizId,
      answers,
    );
    return submission;
  }

  @Get(':quizId/submission/:studentId')
  @ApiOperation({ summary: 'Получить отправку викторины студента' })
  @ApiParam({ name: 'quizId', description: 'ID викторины' })
  @ApiParam({ name: 'studentId', description: 'ID студента' })
  @ApiResponse({
    status: 200,
    description: 'Отправка найдена',
    type: SubmitQuizDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Отправка не найдена',
  })
  @ApiSecurity('JWT-auth')
  async getQuizSubmission(
    @Param('quizId') quizId: string,
    @Param('studentId') studentId: string,
  ) {
    if (!quizId || !studentId) {
      this.logger.warn(`Отсутствует quizId или studentId`);
      throw new BadRequestException('Требуются quizId и studentId');
    }

    this.logger.log(`Поиск отправки ${quizId} для студента ${studentId}`);
    const submission = await this.quizzesService.getQuizSubmission(
      quizId,
      studentId,
    );
    if (!submission) {
      this.logger.warn(`Отправка ${quizId} для ${studentId} не найдена`);
      throw new NotFoundException('Отправка не найдена');
    }
    return submission;
  }

  @Get(':quizId/hints')
  @SetMetadata('roles', [Role.ADMIN, Role.STUDENT])
  @ApiOperation({ summary: 'Получить подсказки для викторины' })
  @ApiParam({ name: 'quizId', description: 'ID викторины' })
  @ApiResponse({
    status: 200,
    description: 'Подсказки найдены',
    schema: {
      example: [{ question: 'Что такое 1+1?', hint: 'Подумай просто' }],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Викторина не найдена',
  })
  @ApiSecurity('JWT-auth')
  async getQuizHints(@Param('quizId') quizId: string) {
    if (!quizId) {
      this.logger.warn('Отсутствует quizId');
      throw new BadRequestException('Требуется quizId');
    }

    this.logger.log(`Получение подсказок для викторины: ${quizId}`);
    const hints = await this.quizzesService.getQuizHints(quizId);
    return hints;
  }
}
