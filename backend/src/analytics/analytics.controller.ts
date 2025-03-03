import { Controller, Get, Param, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { Role } from '../auth/roles.enum';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('course/:courseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.TEACHER, Role.ADMIN, Role.MANAGER])
  async getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.analyticsService.getCourseAnalytics(courseId);
  }

  @Get('overall')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.MANAGER])
  async getOverallAnalytics() {
    return this.analyticsService.getOverallAnalytics();
  }
}
