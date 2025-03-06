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
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('quizzes')
@Controller('quizzes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created' })
  @ApiBearerAuth('JWT-auth')
  async createQuiz(@Body() body: CreateQuizDto) {
    return this.quizzesService.createQuiz(
      body.lessonId,
      body.title,
      body.questions,
      body.timeLimit,
    );
  }

  @Get(':quizId')
  async findQuizById(@Param('quizId') quizId: string) {
    return this.quizzesService.findQuizById(quizId);
  }

  @Get('lesson/:lessonId')
  async findQuizzesByLesson(@Param('lessonId') lessonId: string) {
    return this.quizzesService.findQuizzesByLesson(lessonId);
  }

  @Put(':quizId')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() body: Partial<CreateQuizDto>,
  ) {
    return this.quizzesService.updateQuiz(quizId, body);
  }

  @Delete(':quizId')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async deleteQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.deleteQuiz(quizId);
  }

  @Post(':quizId/submit')
  @SetMetadata('roles', [Role.STUDENT])
  @UsePipes(new ValidationPipe({ transform: true }))
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() body: SubmitQuizDto,
  ) {
    return this.quizzesService.submitQuiz(body.studentId, quizId, body.answers);
  }

  @Get(':quizId/submission/:studentId')
  async getQuizSubmission(
    @Param('quizId') quizId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.quizzesService.getQuizSubmission(quizId, studentId);
  }

  @Get(':quizId/hints')
  @SetMetadata('roles', [Role.STUDENT])
  async getQuizHints(@Param('quizId') quizId: string) {
    return this.quizzesService.getQuizHints(quizId);
  }
}
