import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { User } from '../users/schemas/user.schema';
import { Course } from '../courses/schemas/course.schema';
import { Enrollment } from '../enrollments/schemas/enrollment.schema';
import { Notification } from '../notifications/schemas/notification.schema';
import { GetEnrollmentsDto } from './dto/get-enrollments.dto'; // Новый DTO
import { GetNotificationsDto } from './dto/get-notifications.dto'; // Новый DTO

@ApiTags('Админ')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить список пользователей с фильтром по роли' })
  @ApiResponse({
    status: 200,
    description: 'Пользователи успешно получены',
    type: [User],
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiQuery({
    name: 'role',
    required: false,
    description:
      'Роль для фильтрации пользователей (ищет совпадение в массиве ролей)',
    enum: Role,
  })
  async getUsers(@Query('role') role?: Role): Promise<User[]> {
    this.logger.log(
      `Запрос на получение пользователей с ролью: ${role || 'все'}`,
    );
    return this.adminService.getUsers(role);
  }

  @Get('courses')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить список всех курсов' })
  @ApiResponse({
    status: 200,
    description: 'Курсы успешно получены',
    type: [Course],
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async getCourses(): Promise<Course[]> {
    this.logger.log('Запрос на получение всех курсов');
    return this.adminService.getCourses();
  }

  @Get('enrollments')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить записи о зачислении с фильтром по курсу' })
  @ApiQuery({
    name: 'courseId',
    required: false,
    description: 'ID курса для фильтрации записей',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Записи о зачислении успешно получены',
    type: [Enrollment],
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - требуется роль админа',
  })
  async getEnrollments(
    @Query() query: GetEnrollmentsDto,
  ): Promise<Enrollment[]> {
    this.logger.log(
      `Запрос на получение записей о зачислении с courseId: ${query.courseId || 'все'}`,
    );
    return this.adminService.getEnrollments(query.courseId);
  }

  @Get('notifications')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить уведомления с фильтром по пользователю' })
  @ApiResponse({
    status: 200,
    description: 'Уведомления успешно получены',
    type: [Notification],
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'ID пользователя для фильтрации уведомлений',
  })
  async getNotifications(
    @Query() query: GetNotificationsDto,
  ): Promise<Notification[]> {
    this.logger.log(
      `Запрос на получение уведомлений с userId: ${query.userId || 'все'}`,
    );
    return this.adminService.getNotifications(query.userId);
  }

  @Get('activity')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить сводку по активности платформы' })
  @ApiResponse({
    status: 200,
    description: 'Сводка по активности успешно получена',
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  async getActivity(): Promise<any> {
    this.logger.log('Запрос на получение сводки по активности');
    return this.adminService.getActivity();
  }
}
