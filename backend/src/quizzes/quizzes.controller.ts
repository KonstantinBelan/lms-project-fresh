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
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Quizzes')
@Controller('quizzes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({
    status: 201,
    description: 'Quiz created',
    type: CreateQuizDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
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
  @ApiOperation({ summary: 'Get a quiz by ID' })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async findQuizById(@Param('quizId') quizId: string) {
    return this.quizzesService.findQuizById(quizId);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get quizzes by lesson ID' })
  @ApiParam({
    name: 'lessonId',
    description: 'Lesson ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Quizzes retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Quizzes not found' })
  async findQuizzesByLesson(@Param('lessonId') lessonId: string) {
    return this.quizzesService.findQuizzesByLesson(lessonId);
  }

  @Put(':quizId')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Update a quiz' })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() body: Partial<CreateQuizDto>,
  ) {
    return this.quizzesService.updateQuiz(quizId, body);
  }

  @Delete(':quizId')
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  @ApiOperation({ summary: 'Delete a quiz' })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async deleteQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.deleteQuiz(quizId);
  }

  @Post(':quizId/submit')
  @SetMetadata('roles', [Role.STUDENT])
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Submit a quiz' })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz submitted successfully',
    type: SubmitQuizDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body() body: SubmitQuizDto,
  ) {
    return this.quizzesService.submitQuiz(body.studentId, quizId, body.answers);
  }

  @Get(':quizId/submission/:studentId')
  @ApiOperation({ summary: 'Get quiz submission by student ID' })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz submission retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Quiz submission not found' })
  async getQuizSubmission(
    @Param('quizId') quizId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.quizzesService.getQuizSubmission(quizId, studentId);
  }

  @Get(':quizId/hints')
  @SetMetadata('roles', [Role.STUDENT])
  @ApiOperation({ summary: 'Get hints for a quiz' })
  @ApiParam({
    name: 'quizId',
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz hints retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Quiz hints not found' })
  @ApiBearerAuth('JWT-auth')
  async getQuizHints(@Param('quizId') quizId: string) {
    return this.quizzesService.getQuizHints(quizId);
  }
}
