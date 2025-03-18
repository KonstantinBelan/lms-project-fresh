import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
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
import { NotificationResponseDto } from './dto/notification-response.dto';
import { GetEnrollmentsDto } from './dto/get-enrollments.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { ActivitySummaryDto } from './dto/activity-summary.dto';
import { GetCoursesDto } from './dto/get-courses.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { GetActivityDto } from './dto/get-activity.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { PaginatedUserResponseDto } from '../users/dto/paginated-user-response.dto';
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
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Получить список пользователей с фильтрами и пагинацией',
  })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей успешно получен',
    type: PaginatedUserResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getUsers(
    @Query() filters: GetUsersDto,
  ): Promise<PaginatedUserResponseDto> {
    return this.adminService.getUsers(filters);
  }

  // Получение списка курсов с фильтрами и пагинацией
  @Get('courses')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить список курсов с фильтрами и пагинацией' })
  @ApiQuery({
    name: 'title',
    description:
      'Название курса для фильтрации (поддерживает частичное совпадение)',
    required: false,
    type: String,
    example: 'Математика',
  })
  @ApiQuery({
    name: 'page',
    description: 'Номер страницы для пагинации (начинается с 1)',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Список курсов успешно получен',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getCourses(@Query() query: GetCoursesDto): Promise<CourseResponseDto> {
    this.logger.log(
      `Запрос курсов: страница ${query.page}, лимит ${query.limit}`,
    );
    return await this.adminService.getCourses(query);
  }

  // Получение записей о зачислении с фильтрами и пагинацией
  @Get('enrollments')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Получить записи о зачислении с фильтрами и пагинацией',
  })
  @ApiQuery({
    name: 'courseId',
    description: 'ID курса для фильтрации записей (MongoDB ObjectId)',
    required: false,
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'studentId',
    description: 'ID пользователя для фильтрации записей (MongoDB ObjectId)',
    required: false,
    type: String,
    example: '507f1f77bcf86cd799439012',
  })
  @ApiQuery({
    name: 'page',
    description: 'Номер страницы для пагинации (начинается с 1)',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Записи о зачислении успешно получены',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async getEnrollments(
    @Query() query: GetEnrollmentsDto,
  ): Promise<EnrollmentResponseDto> {
    this.logger.log(
      `Запрос записей о зачислении: страница ${query.page}, лимит ${query.limit}`,
    );
    const result = await this.adminService.getEnrollments(query);
    return result;
  }

  // Получение уведомлений с фильтрами и пагинацией
  @Get('notifications')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить уведомления с фильтрами и пагинацией' })
  @ApiQuery({
    name: 'userId',
    description:
      'ID пользователя для фильтрации уведомлений (MongoDB ObjectId)',
    required: false,
    type: String,
    example: '507f1f77bcf86cd799439012',
  })
  @ApiQuery({
    name: 'courseId',
    description:
      'ID курса для фильтрации уведомлений (MongoDB ObjectId, если применимо)',
    required: false,
    type: String,
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'page',
    description: 'Номер страницы для пагинации (начинается с 1)',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Уведомления успешно получены',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  @UsePipes(
    new ValidationPipe({
      transform: true, // Включаем преобразование типов
      whitelist: true, // Удаляем лишние параметры
      forbidNonWhitelisted: true, // Запрещаем неизвестные параметры
    }),
  )
  async getNotifications(
    @Query() query: GetNotificationsDto,
  ): Promise<NotificationResponseDto> {
    this.logger.log(
      `Запрос уведомлений: страница ${query.page}, лимит ${query.limit}`,
    );
    const result = await this.adminService.getNotifications(query);
    return result;
  }

  // Получение сводки по активности платформы
  @Get('activity')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Получить сводку по активности платформы с фильтром по датам',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата для фильтрации активности (формат ISO 8601)',
    required: false,
    type: String,
    example: '2025-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата для фильтрации активности (формат ISO 8601)',
    required: false,
    type: String,
    example: '2025-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'page',
    description: 'Номер страницы для пагинации (начинается с 1)',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Количество записей на странице (максимум 100)',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Сводка по активности успешно получена',
    type: ActivitySummaryDto,
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getActivity(
    @Query() query: GetActivityDto,
  ): Promise<ActivitySummaryDto> {
    this.logger.log('Запрос сводки по активности');
    return this.adminService.getActivity(query);
  }
}
