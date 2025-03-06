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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuizzesService } from './quizzes.service';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('quizzes')
// @UseGuards(JwtAuthGuard, RolesGuard)
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async createQuiz(
    @Body()
    body: {
      lessonId: string;
      title: string;
      questions: {
        question: string;
        options: string[];
        correctAnswer: number;
      }[];
    },
  ) {
    return this.quizzesService.createQuiz(
      body.lessonId,
      body.title,
      body.questions,
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
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body()
    body: {
      title?: string;
      questions?: {
        question: string;
        options: string[];
        correctAnswer: number;
      }[];
    },
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
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() body: { studentId: string; answers: number[] },
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
}
