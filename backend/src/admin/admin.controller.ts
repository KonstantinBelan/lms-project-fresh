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
import {
  PaginatedNotificationDto,
  PaginatedNotificationResponseDto,
} from './dto/paginated-notification-response.dto';
import { GetEnrollmentsDto } from './dto/get-enrollments.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { ActivitySummaryDto } from './dto/activity-summary.dto';
import { GetCoursesDto } from './dto/get-courses.dto';
import { PaginatedCourseResponseDto } from './dto/paginated-course-response.dto';
import { GetActivityDto } from './dto/get-activity.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { PaginatedUserResponseDto } from '../users/dto/paginated-user-response.dto';
import { mapToUserResponseDto } from '../users/mappers/user.mapper';
import {
  PaginatedEnrollmentDto,
  PaginatedEnrollmentResponseDto,
} from './dto/paginated-enrollment-response.dto';

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
    this.logger.log(
      `Запрос пользователей: страница ${filters.page}, лимит ${filters.limit}`,
    );
    return this.adminService.getUsers(filters);
  }

  // Получение списка курсов с фильтрами и пагинацией
  @Get('courses')
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Получить список курсов с фильтрами и пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Список курсов успешно получен',
    type: PaginatedCourseResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getCourses(
    @Query() filters: GetCoursesDto,
  ): Promise<PaginatedCourseResponseDto> {
    this.logger.log(
      `Запрос курсов: страница ${filters.page}, лимит ${filters.limit}`,
    );
    return this.adminService.getCourses(filters);
  }

  // Получение записей о зачислении с фильтрами и пагинацией
  @Get('enrollments')
  @Roles(Role.ADMIN)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({
    summary: 'Получить записи о зачислении с фильтрами и пагинацией',
  })
  @ApiResponse({
    status: 200,
    description: 'Записи о зачислении успешно получены',
    type: PaginatedEnrollmentResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещён' })
  async getEnrollments(
    @Query() query: GetEnrollmentsDto,
  ): Promise<PaginatedEnrollmentDto> {
    this.logger.log(
      `Запрос записей о зачислении: страница ${query.page}, лимит ${query.limit}`,
    );
    return this.adminService.getEnrollments(query);
  }

  // Получение уведомлений с фильтрами и пагинацией
  @Get('notifications')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить уведомления с фильтрами и пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Уведомления успешно получены',
    type: PaginatedNotificationResponseDto,
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
  ): Promise<PaginatedNotificationDto> {
    this.logger.log(
      `Запрос уведомлений: страница ${query.page}, лимит ${query.limit}`,
    );
    return this.adminService.getNotifications(query);
  }

  // Получение сводки по активности платформы
  @Get('activity')
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Получить сводку по активности платформы с фильтром по датам',
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
