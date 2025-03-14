import { Controller, Get, Param, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CourseAnalyticsDto } from './dto/course-analytics.dto';
import { OverallAnalyticsDto } from './dto/overall-analytics.dto';
import { GetCourseAnalyticsDto } from './dto/get-course-analytics.dto';

@ApiTags('Аналитика')
@Controller('analytics')
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получить аналитику по курсу' })
  @ApiParam({
    name: 'courseId',
    description: 'ID курса',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Аналитика курса успешно получена',
    type: CourseAnalyticsDto,
    example: {
      courseId: '507f1f77bcf86cd799439011',
      courseTitle: 'Основы программирования',
      totalStudents: 50,
      completedStudents: 45,
      completionRate: 90,
      averageGrade: 4.5,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный ID курса',
    example: { message: 'Некорректный ID курса', statusCode: 400 },
  })
  @ApiResponse({
    status: 404,
    description: 'Курс или аналитика не найдены',
    example: {
      message: 'Курс с ID 507f1f77bcf86cd799439011 не найден',
      statusCode: 404,
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.MANAGER)
  async getCourseAnalytics(
    @Param() params: GetCourseAnalyticsDto,
  ): Promise<CourseAnalyticsDto> {
    this.logger.log(`Запрос аналитики для курса с ID: ${params.courseId}`);
    const result = await this.analyticsService.getCourseAnalytics(
      params.courseId,
    );
    this.logger.log(`Аналитика для курса ${params.courseId} успешно получена`);
    return result;
  }

  @Get('overall')
  @ApiOperation({ summary: 'Получить общую аналитику платформы' })
  @ApiResponse({
    status: 200,
    description: 'Общая аналитика успешно получена',
    type: OverallAnalyticsDto,
    example: {
      totalStudents: 1000,
      completedStudents: 800,
      completionRate: 80,
      averageGrade: 4.2,
      totalCourses: 50,
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Общая аналитика не найдена',
    example: { message: 'Общая аналитика не найдена', statusCode: 404 },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getOverallAnalytics(): Promise<OverallAnalyticsDto> {
    this.logger.log('Запрос общей аналитики платформы');
    const result = await this.analyticsService.getOverallAnalytics();
    this.logger.log('Общая аналитика успешно получена');
    return result;
  }
}
