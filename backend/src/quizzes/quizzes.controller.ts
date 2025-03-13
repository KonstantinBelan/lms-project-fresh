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
  @ApiBody({
    type: CreateQuizDto,
    description: 'Данные для создания викторины',
    schema: {
      example: {
        lessonId: '67c848293c783d942cafb836',
        title: 'Основы математики',
        questions: [
          {
            question: 'Что такое 1+1?',
            options: ['1', '2', '3'],
            correctAnswers: [1],
            weight: 2,
            hint: 'Подумай просто',
          },
        ],
        timeLimit: 10,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Викторина успешно создана',
    type: CreateQuizDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - некорректные данные',
  })
  @ApiSecurity('JWT-auth')
  async createQuiz(@Body() body: CreateQuizDto) {
    const { lessonId, title, questions, timeLimit } = body;

    if (!lessonId || !title || !questions?.length) {
      this.logger.warn(
        `Некорректные данные для создания викторины: ${JSON.stringify(body)}`,
      );
      throw new BadRequestException(
        'Требуются lessonId, title и хотя бы один вопрос',
      );
    }

    this.logger.log(
      `Создание викторины для урока ${lessonId} с названием "${title}"`,
    );
    const quiz = await this.quizzesService.createQuiz(
      lessonId,
      title,
      questions,
      timeLimit,
    );
    this.logger.log(
      `Викторина успешно создана: ${quiz._id?.toString() || 'unknown'}`,
    );
    return quiz;
  }

  @Get(':quizId')
  @ApiOperation({ summary: 'Получить викторину по ID' })
  @ApiParam({
    name: 'quizId',
    description: 'Идентификатор викторины',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Викторина успешно получена',
    type: CreateQuizDto,
  })
  @ApiResponse({ status: 404, description: 'Викторина не найдена' })
  @ApiSecurity('JWT-auth')
  async findQuizById(@Param('quizId') quizId: string) {
    if (!quizId) {
      this.logger.warn('Отсутствует quizId в запросе');
      throw new BadRequestException('Требуется quizId');
    }

    this.logger.log(`Получение викторины с ID ${quizId}`);
    const quiz = await this.quizzesService.findQuizById(quizId);
    if (!quiz) {
      this.logger.warn(`Викторина с ID ${quizId} не найдена`);
      throw new NotFoundException(`Викторина с ID ${quizId} не найдена`);
    }
    return quiz;
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Получить викторины по ID урока' })
  @ApiParam({
    name: 'lessonId',
    description: 'Идентификатор урока',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Викторины успешно получены',
    type: [CreateQuizDto],
  })
  @ApiResponse({ status: 404, description: 'Викторины не найдены' })
  @ApiSecurity('JWT-auth')
  async findQuizzesByLesson(@Param('lessonId') lessonId: string) {
    if (!lessonId) {
      this.logger.warn('Отсутствует lessonId в запросе');
      throw new BadRequestException('Требуется lessonId');
    }

    this.logger.log(`Получение викторин для урока ${lessonId}`);
    const quizzes = await this.quizzesService.findQuizzesByLesson(lessonId);
    if (!quizzes.length) {
      this.logger.log(`Викторины для урока ${lessonId} не найдены`);
    }
    return quizzes;
  }

  @Put(':quizId')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Обновить викторину' })
  @ApiParam({
    name: 'quizId',
    description: 'Идентификатор викторины',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: CreateQuizDto,
    description: 'Данные для обновления викторины (частично)',
    schema: {
      example: {
        title: 'Обновленные основы математики',
        timeLimit: 15,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Викторина успешно обновлена',
    type: CreateQuizDto,
  })
  @ApiResponse({ status: 404, description: 'Викторина не найдена' })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - некорректные данные',
  })
  @ApiSecurity('JWT-auth')
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() body: Partial<CreateQuizDto>,
  ) {
    if (!quizId) {
      this.logger.warn('Отсутствует quizId в запросе');
      throw new BadRequestException('Требуется quizId');
    }

    if (Object.keys(body).length === 0) {
      this.logger.warn('Отсутствуют данные для обновления викторины');
      throw new BadRequestException('Требуются данные для обновления');
    }

    this.logger.log(
      `Обновление викторины ${quizId} с данными: ${JSON.stringify(body)}`,
    );
    const updatedQuiz = await this.quizzesService.updateQuiz(quizId, body);
    if (!updatedQuiz) {
      this.logger.warn(`Викторина с ID ${quizId} не найдена`);
      throw new NotFoundException(`Викторина с ID ${quizId} не найдена`);
    }
    this.logger.log(`Викторина успешно обновлена: ${quizId}`);
    return updatedQuiz;
  }

  @Delete(':quizId')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @ApiOperation({ summary: 'Удалить викторину' })
  @ApiParam({
    name: 'quizId',
    description: 'Идентификатор викторины',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Викторина успешно удалена',
    schema: { example: { message: 'Викторина удалена' } },
  })
  @ApiResponse({ status: 404, description: 'Викторина не найдена' })
  @ApiSecurity('JWT-auth')
  async deleteQuiz(@Param('quizId') quizId: string) {
    if (!quizId) {
      this.logger.warn('Отсутствует quizId в запросе');
      throw new BadRequestException('Требуется quizId');
    }

    this.logger.log(`Удаление викторины ${quizId}`);
    await this.quizzesService.deleteQuiz(quizId);
    this.logger.log(`Викторина успешно удалена: ${quizId}`);
    return { message: 'Викторина удалена' };
  }

  @Post(':quizId/submit')
  @SetMetadata('roles', [Role.STUDENT])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Отправить ответы на викторину' })
  @ApiParam({
    name: 'quizId',
    description: 'Идентификатор викторины',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    type: SubmitQuizDto,
    description: 'Данные для отправки ответов',
    schema: {
      example: {
        studentId: '507f1f77bcf86cd799439011',
        answers: [[1], '2'],
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Викторина успешно отправлена',
    type: SubmitQuizDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный запрос - некорректные данные',
  })
  @ApiSecurity('JWT-auth')
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() body: SubmitQuizDto,
  ) {
    const { studentId, answers } = body;

    if (!quizId) {
      this.logger.warn('Отсутствует quizId в запросе');
      throw new BadRequestException('Требуется quizId');
    }

    if (!studentId || !answers?.length) {
      this.logger.warn(
        `Некорректные данные для отправки викторины: ${JSON.stringify(body)}`,
      );
      throw new BadRequestException('Требуются studentId и хотя бы один ответ');
    }

    this.logger.log(
      `Отправка викторины ${quizId} от студента ${studentId} с ответами: ${JSON.stringify(answers)}`,
    );
    const submission = await this.quizzesService.submitQuiz(
      studentId,
      quizId,
      answers,
    );
    this.logger.log(
      `Викторина успешно отправлена: ${quizId}, оценка: ${submission.score}`,
    );
    return submission;
  }

  @Get(':quizId/submission/:studentId')
  @ApiOperation({ summary: 'Получить отправку викторины по ID студента' })
  @ApiParam({
    name: 'quizId',
    description: 'Идентификатор викторины',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Идентификатор студента',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Отправка викторины успешно получена',
    type: SubmitQuizDto,
  })
  @ApiResponse({ status: 404, description: 'Отправка викторины не найдена' })
  @ApiSecurity('JWT-auth')
  async getQuizSubmission(
    @Param('quizId') quizId: string,
    @Param('studentId') studentId: string,
  ) {
    if (!quizId || !studentId) {
      this.logger.warn(
        `Отсутствует quizId или studentId в запросе: quizId=${quizId}, studentId=${studentId}`,
      );
      throw new BadRequestException('Требуются quizId и studentId');
    }

    this.logger.log(
      `Получение отправки викторины ${quizId} для студента ${studentId}`,
    );
    const submission = await this.quizzesService.getQuizSubmission(
      quizId,
      studentId,
    );
    if (!submission) {
      this.logger.warn(
        `Отправка викторины ${quizId} для студента ${studentId} не найдена`,
      );
      throw new NotFoundException('Отправка викторины не найдена');
    }
    return submission;
  }

  @Get(':quizId/hints')
  @SetMetadata('roles', [Role.STUDENT])
  @ApiOperation({ summary: 'Получить подсказки для викторины' })
  @ApiParam({
    name: 'quizId',
    description: 'Идентификатор викторины',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Подсказки для викторины успешно получены',
    schema: {
      example: [
        { question: 'Что такое 1+1?', hint: 'Подумай просто' },
        { question: 'Что такое 2+2?', hint: undefined },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Викторина не найдена' })
  @ApiSecurity('JWT-auth')
  async getQuizHints(@Param('quizId') quizId: string) {
    if (!quizId) {
      this.logger.warn('Отсутствует quizId в запросе');
      throw new BadRequestException('Требуется quizId');
    }

    this.logger.log(`Получение подсказок для викторины ${quizId}`);
    const hints = await this.quizzesService.getQuizHints(quizId);
    if (!hints) {
      this.logger.warn(`Викторина с ID ${quizId} не найдена`);
      throw new NotFoundException(`Викторина с ID ${quizId} не найдена`);
    }
    return hints;
  }
}
