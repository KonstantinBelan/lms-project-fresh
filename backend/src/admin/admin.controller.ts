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
import { GetEnrollmentsDto } from './dto/get-enrollments.dto';
import {
  GetNotificationsDto,
  INotificationResponse,
} from './dto/get-notifications.dto';
import { GetCoursesDto, ICourseResponse } from './dto/get-courses.dto';
import { GetActivityDto, IActivityResponse } from './dto/get-activity.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { mapToUserResponseDto } from '../users/mappers/user.mapper';

@ApiTags('Админ')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  // Получение списка пользователей с фильтрами и пагинацией
  @Get('users')
  @Roles(Role.ADMIN)
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
  @ApiResponse({ status: 200, description: 'Пользователи успешно получены' })
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
    this.logger.log(`Запрос пользователей: страница ${page}, лимит ${limit}`);
    const filters: { roles?: string[]; email?: string; groups?: string[] } = {};
    if (roles) filters.roles = roles.split(',').map((role) => role.trim());
    if (email) filters.email = email;
    if (groups) filters.groups = groups.split(',').map((group) => group.trim());

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);

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

  // Получение списка курсов с фильтрами и пагинацией
  @Get('courses')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить список курсов с фильтрами и пагинацией' })
  @ApiQuery({
    name: 'title',
    description: 'Название курса (частичное совпадение)',
    required: false,
    example: 'Математика',
  })
  @ApiQuery({
    name: 'teacherId',
    description: 'ID преподавателя',
    required: false,
    example: '507f1f77bcf86cd799439012',
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
  @ApiResponse({ status: 200, description: 'Курсы успешно получены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getCourses(@Query() query: GetCoursesDto): Promise<ICourseResponse> {
    this.logger.log(
      `Запрос курсов: страница ${query.page}, лимит ${query.limit}`,
    );
    const result = await this.adminService.getCourses(query);
    return result; // Уже содержит data, total, page, limit, totalPages
  }

  // Получение записей о зачислении с фильтрами и пагинацией
  @Get('enrollments')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Получить записи о зачислении с фильтрами и пагинацией',
  })
  @ApiQuery({
    name: 'courseId',
    description: 'ID курса для фильтрации',
    required: false,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'userId',
    description: 'ID пользователя для фильтрации',
    required: false,
    example: '507f1f77bcf86cd799439012',
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
    description: 'Записи о зачислении успешно получены',
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getEnrollments(@Query() query: GetEnrollmentsDto): Promise<{
    data: Enrollment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Запрос записей о зачислении: страница ${query.page}, лимит ${query.limit}`,
    );
    const pageNum = query.page ?? 1;
    const limitNum = Math.min(query.limit ?? 10, 100);
    const { enrollments, total } = await this.adminService.getEnrollments({
      ...query,
      page: pageNum,
      limit: limitNum,
    });
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: enrollments,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  // Получение уведомлений с фильтрами и пагинацией
  @Get('notifications')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить уведомления с фильтрами и пагинацией' })
  @ApiQuery({
    name: 'userId',
    description: 'ID пользователя для фильтрации',
    required: false,
    example: '507f1f77bcf86cd799439012',
  })
  @ApiQuery({
    name: 'courseId',
    description: 'ID курса для фильтрации (если применимо)',
    required: false,
    example: '507f1f77bcf86cd799439011',
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
  @ApiResponse({ status: 200, description: 'Уведомления успешно получены' })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getNotifications(
    @Query() query: GetNotificationsDto,
  ): Promise<INotificationResponse> {
    this.logger.log(
      `Запрос уведомлений: страница ${query.page}, лимит ${query.limit}`,
    );
    const result = await this.adminService.getNotifications(query);
    return result; // Уже содержит data, total, page, limit, totalPages
  }

  // Получение сводки по активности платформы
  @Get('activity')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Получить сводку по активности платформы с фильтром по датам',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата (ISO 8601)',
    required: false,
    example: '2025-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата (ISO 8601)',
    required: false,
    example: '2025-12-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Сводка по активности успешно получена',
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getActivity(
    @Query() query: GetActivityDto,
  ): Promise<IActivityResponse> {
    this.logger.log('Запрос сводки по активности');
    return this.adminService.getActivity(query);
  }
}
