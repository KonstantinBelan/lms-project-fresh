import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/roles.enum';
import { SetMetadata } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @SetMetadata('roles', [Role.ADMIN])
  @ApiOperation({ summary: 'Get users with optional role filter' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Role of the users to filter',
  })
  async getUsers(@Query('role') role?: string) {
    return this.adminService.getUsers(role);
  }

  @Get('courses')
  @SetMetadata('roles', [Role.ADMIN])
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCourses() {
    return this.adminService.getCourses();
  }

  @Get('enrollments')
  @SetMetadata('roles', [Role.ADMIN])
  @ApiOperation({ summary: 'Get enrollments with optional courseId filter' })
  @ApiResponse({
    status: 200,
    description: 'Enrollments retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'Course ID to filter enrollments',
  })
  async getEnrollments(@Query('courseId') courseId?: string) {
    return this.adminService.getEnrollments(courseId);
  }

  @Get('notifications')
  @SetMetadata('roles', [Role.ADMIN])
  @ApiOperation({ summary: 'Get notifications with optional userId filter' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID to filter notifications',
  })
  async getNotifications(@Query('userId') userId?: string) {
    return this.adminService.getNotifications(userId);
  }

  @Get('activity')
  @SetMetadata('roles', [Role.ADMIN])
  @ApiOperation({ summary: 'Get overall activity summary' })
  @ApiResponse({
    status: 200,
    description: 'Activity summary retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getActivity() {
    return this.adminService.getActivity();
  }
}
