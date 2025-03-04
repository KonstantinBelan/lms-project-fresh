import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Query('role') role?: string) {
    return this.adminService.getUsers(role);
  }

  @Get('courses')
  async getCourses() {
    return this.adminService.getCourses();
  }

  @Get('enrollments')
  async getEnrollments(@Query('courseId') courseId?: string) {
    return this.adminService.getEnrollments(courseId);
  }

  @Get('notifications')
  async getNotifications(@Query('userId') userId?: string) {
    return this.adminService.getNotifications(userId);
  }

  @Get('activity')
  async getActivity() {
    return this.adminService.getActivity();
  }
}
