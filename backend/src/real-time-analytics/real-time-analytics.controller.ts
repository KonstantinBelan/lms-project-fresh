import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RealTimeAnalyticsService } from './real-time-analytics.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import {
  IStudentProgress,
  ICourseActivity,
} from './real-time-analytics.service'; // Импорт типов

@ApiTags('Аналитика в реальном времени')
@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class RealTimeAnalyticsController {
  constructor(private readonly analyticsService: RealTimeAnalyticsService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Получить прогресс студента' })
  @ApiResponse({ status: 200, description: 'Прогресс студента', type: Object }) // Используем Object как временный тип для Swagger
  @ApiSecurity('JWT-auth')
  async getStudentProgress(
    @Param('studentId') studentId: string,
  ): Promise<IStudentProgress> {
    return this.analyticsService.getStudentProgress(studentId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получить активность курса' })
  @ApiResponse({ status: 200, description: 'Активность курса', type: Object }) // Используем Object как временный тип для Swagger
  @ApiSecurity('JWT-auth')
  async getCourseActivity(
    @Param('courseId') courseId: string,
  ): Promise<ICourseActivity> {
    return this.analyticsService.getCourseActivity(courseId);
  }
}
