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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ConnectTelegramDto } from './dto/connect-telegram.dto';
import { Role } from '../auth/roles.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { GroupsService } from '../groups/groups.service';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { User } from './schemas/user.schema';
import { JwtRequest } from '../common/interfaces/jwt-request.interface';

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
  @ApiResponse({ status: 201, description: 'Пользователь создан', type: User })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Создание пользователя с email: ${createUserDto.email}`);
    return this.usersService.create({
      email: createUserDto.email,
      password: createUserDto.password,
      roles: createUserDto.roles || [Role.STUDENT],
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Получить текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Текущий пользователь получен',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: JwtRequest): Promise<User> {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) {
      this.logger.error('Отсутствует ID пользователя в токене', req.user);
      throw new BadRequestException('Неверный токен');
    }
    this.logger.log(`Получение данных пользователя с ID: ${userId}`);
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  @Get('all')
  @ApiOperation({ summary: 'Получить всех пользователей' })
  @ApiResponse({
    status: 200,
    description: 'Все пользователи получены',
    type: [User],
  })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(): Promise<User[]> {
    this.logger.log('Получение списка всех пользователей');
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({
    name: 'id',
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Пользователь найден', type: User })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 403, description: 'Доступ запрещен' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  async findById(@Param('id') id: string): Promise<User> {
    this.logger.log(`Поиск пользователя с ID: ${id}`);
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    return user;
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Найти пользователя по email' })
  @ApiParam({
    name: 'email',
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @ApiResponse({ status: 200, description: 'Пользователь найден', type: User })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async findUserByEmail(@Param('email') email: string): Promise<User> {
    this.logger.log(`Поиск пользователя по email: ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new NotFoundException(`Пользователь с email ${email} не найден`);
    return user;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiParam({
    name: 'id',
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь обновлен',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; roles?: Role[] },
  ): Promise<User> {
    this.logger.log(`Обновление пользователя с ID: ${id}`);
    const updatedUser = await this.usersService.updateUser(id, body);
    if (!updatedUser)
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    return updatedUser;
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
    description: 'Пользователь удален',
    schema: { example: { message: 'Пользователь удален' } },
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
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
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь или группа не найдены',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async addToGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ): Promise<User> {
    this.logger.log(`Добавление пользователя ${id} в группу ${groupId}`);
    await this.groupsService.addStudent(groupId, id);
    const updatedUser = await this.usersService.updateUser(id, {
      groups: { $addToSet: groupId },
    });
    if (!updatedUser)
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    return updatedUser;
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
      Привязывает ID чата Telegram к профилю пользователя для получения уведомлений.

      **Как получить ваш Telegram chat ID:**
      1. Откройте Telegram и найдите бота @LMSNotificationBot.
      2. Отправьте боту команду /start.
      3. Бот ответит вам вашим chat ID (например, 123456789).
      4. Скопируйте этот ID и используйте его в поле 'telegramId' ниже.
      5. Отправьте PATCH-запрос с вашим chat ID на этот эндпоинт.

      Пример: { "telegramId": "123456789" }
    `,
  })
  @ApiResponse({ status: 200, description: 'Telegram подключен', type: User })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  async connectTelegram(
    @Req() req: JwtRequest,
    @Body() connectDto: ConnectTelegramDto,
  ): Promise<User> {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) {
      this.logger.error('Отсутствует ID пользователя в токене', req.user);
      throw new BadRequestException('Неверный токен');
    }
    this.logger.log(`Подключение Telegram для пользователя ${userId}`);
    const updatedUser = await this.usersService.updateUser(userId, {
      telegramId: connectDto.telegramId,
    });
    if (!updatedUser) throw new BadRequestException('Пользователь не найден');
    return updatedUser;
  }
}
