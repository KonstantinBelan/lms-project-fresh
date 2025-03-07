import { Controller, Get, Param, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { Role } from '../auth/roles.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get course analytics' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Course analytics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Course analytics not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  async getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.analyticsService.getCourseAnalytics(courseId);
  }

  @Get('overall')
  @ApiOperation({ summary: 'Get overall platform analytics' })
  @ApiResponse({
    status: 200,
    description: 'Overall analytics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Overall analytics not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  async getOverallAnalytics() {
    return this.analyticsService.getOverallAnalytics();
  }
}
