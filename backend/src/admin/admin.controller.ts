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
import { UserResponseDto } from '../users/dto/user-response.dto';
import { mapToUserResponseDto } from '../users/mappers/user.mapper';

@ApiTags('Админ')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({
    summary: 'Получить список пользователей с фильтрами и пагинацией',
  })
  @ApiQuery({
    name: 'roles',
    description: 'Фильтр по ролям (через запятую)',
    required: false,
    example: 'STUDENT,TEACHER',
  })
  @ApiQuery({
    name: 'email',
    description: 'Фильтр по email (частичное совпадение)',
    required: false,
    example: 'user@example.com',
  })
  @ApiQuery({
    name: 'groups',
    description: 'Фильтр по ID групп (через запятую)',
    required: false,
    example: '507f1f77bcf86cd799439011,507f1f77bcf86cd799439012',
  })
  @ApiQuery({
    name: 'page',
    description: 'Номер страницы (начиная с 1)',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователи успешно получены',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserResponseDto' },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getUsers(
    @Query('roles') roles?: string,
    @Query('email') email?: string,
    @Query('groups') groups?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      'Запрос на получение пользователей с фильтрами и пагинацией',
    );
    const filters: { roles?: string[]; email?: string; groups?: string[] } = {};
    if (roles) filters.roles = roles.split(',').map((role) => role.trim());
    if (email) filters.email = email;
    if (groups) filters.groups = groups.split(',').map((group) => group.trim());

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100); // Ограничим до 100

    const { users, total } = await this.adminService.getUsers(
      filters,
      pageNum,
      limitNum,
    );
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: users.map(mapToUserResponseDto),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
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
