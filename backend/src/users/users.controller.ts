import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Put,
  UseGuards,
  Param,
  Req,
  UsePipes,
  ValidationPipe,
  Patch,
  Logger,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { ConnectTelegramDto } from './dto/connect-telegram.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { GroupsService } from '../groups/groups.service';
import {
  ApiBody,
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtRequest } from '../common/interfaces/jwt-request.interface';
import { mapToUserResponseDto } from './mappers/user.mapper';
import * as bcrypt from 'bcrypt';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Пользователи')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно создан',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные или email уже существует',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен',
    type: ErrorResponseDto,
  })
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Создание пользователя с email: ${createUserDto.email}`);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      email: createUserDto.email,
      password: hashedPassword,
      roles: createUserDto.roles || [Role.STUDENT],
      name: createUserDto.name,
    });
    return mapToUserResponseDto(user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Получить данные текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Данные текущего пользователя получены',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: JwtRequest): Promise<UserResponseDto> {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) {
      this.logger.error('Отсутствует ID пользователя в токене', req.user);
      throw new BadRequestException('Неверный токен');
    }
    this.logger.log(`Получение данных пользователя с ID: ${userId}`);
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('Пользователь не найден');
    return mapToUserResponseDto(user);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Получить всех пользователей с фильтрами и пагинацией',
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
    description: 'Список пользователей с пагинацией',
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
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен',
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(
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
    this.logger.log('Получение списка пользователей с фильтрами');
    const filters: { roles?: string[]; email?: string; groups?: string[] } = {};
    if (roles) filters.roles = roles.split(',').map((role) => role.trim());
    if (email) filters.email = email;
    if (groups) filters.groups = groups.split(',').map((group) => group.trim());

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);

    const { users, total } = await this.usersService.findAll(
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

  @Get('email/:email')
  @ApiOperation({ summary: 'Найти пользователя по email' })
  @ApiParam({
    name: 'email',
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь найден',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async findUserByEmail(
    @Param('email') email: string,
  ): Promise<UserResponseDto> {
    this.logger.log(`Поиск пользователя по email: ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new NotFoundException(`Пользователь с email ${email} не найден`);
    return mapToUserResponseDto(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить данные пользователя' })
  @ApiBody({ type: EditUserDto })
  @ApiParam({
    name: 'id',
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно обновлен',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Некорректный ID или пустой запрос',
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @UsePipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
      validateCustomDecorators: true,
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() editUserDto: EditUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Обновление пользователя с ID: ${id}`);

    // Проверяем, есть ли хотя бы одно поле с реальным значением
    const hasData = Object.values(editUserDto).some(
      (value) => value !== undefined,
    );
    if (!hasData) {
      this.logger.warn(`Пустой запрос для обновления пользователя с ID: ${id}`);
      throw new BadRequestException('Запрос не содержит данных для обновления');
    }

    const updatedUser = await this.usersService.updateUser(id, editUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }
    return mapToUserResponseDto(updatedUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiParam({
    name: 'id',
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно удален',
    schema: { example: { message: 'Пользователь удален' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден',
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Удаление пользователя с ID: ${id}`);
    await this.usersService.deleteUser(id);
    return { message: 'Пользователь удален' };
  }

  @Post(':id/groups/:groupId')
  @ApiOperation({ summary: 'Добавить пользователя в группу' })
  @ApiParam({
    name: 'id',
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID группы',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь добавлен в группу',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь или группа не найдены',
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async addToGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ): Promise<UserResponseDto> {
    this.logger.log(`Добавление пользователя ${id} в группу ${groupId}`);
    await this.groupsService.addStudent(groupId, id);
    const updatedUser = await this.usersService.updateUser(id, {
      groups: { $addToSet: groupId },
    });
    if (!updatedUser)
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    return mapToUserResponseDto(updatedUser);
  }

  @Delete(':id/groups/:groupId')
  @ApiOperation({ summary: 'Удалить пользователя из группы' })
  @ApiParam({
    name: 'id',
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'groupId',
    description: 'ID группы',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь удален из группы',
    schema: { example: { message: 'Пользователь удален из группы' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь или группа не найдены',
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async removeFromGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Удаление пользователя ${id} из группы ${groupId}`);
    await this.groupsService.removeStudent(groupId, id);
    await this.usersService.updateUser(id, { groups: { $pull: groupId } });
    return { message: 'Пользователь удален из группы' };
  }

  @Patch('me/telegram')
  @ApiOperation({
    summary: 'Подключить Telegram',
    description: `
      Привязывает ID чата Telegram к профилю пользователя для уведомлений.

      **Как получить Telegram chat ID:**
      1. Откройте Telegram и найдите бота @LMSNotificationBot.
      2. Отправьте боту команду /start.
      3. Бот ответит вам вашим chat ID (например, 123456789).
      4. Скопируйте этот ID и используйте в поле 'telegramId'.
      5. Отправьте PATCH-запрос с вашим chat ID.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Telegram успешно подключен',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный telegramId',
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  async connectTelegram(
    @Req() req: JwtRequest,
    @Body() connectDto: ConnectTelegramDto,
  ): Promise<UserResponseDto> {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) {
      this.logger.error('Отсутствует ID пользователя в токене', req.user);
      throw new BadRequestException('Неверный токен');
    }
    this.logger.log(`Подключение Telegram для пользователя ${userId}`);
    const updatedUser = await this.usersService.updateUser(userId, {
      telegramId: connectDto.telegramId,
    });
    if (!updatedUser) throw new NotFoundException('Пользователь не найден');
    return mapToUserResponseDto(updatedUser);
  }
}
