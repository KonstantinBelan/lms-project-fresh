import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Put,
  UseGuards,
  Param,
  Request,
  SetMetadata,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../auth/roles.enum';
import { GroupsService } from '../groups/groups.service';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private groupsService: GroupsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create({
      email: createUserDto.email,
      password: createUserDto.password,
      roles: createUserDto.roles || [Role.STUDENT], // Преобразуем role в массив ролей, если он строка
    });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req) {
    console.log('User from JWT:', req.user); // Логируем req.user для диагностики
    const userId = req.user?.sub || req.user?._id; // Извлекаем sub или _id, если sub отсутствует
    if (!userId) {
      console.error('No user ID found in JWT payload:', req.user);
      throw new Error('Invalid user ID in token');
    }
    return this.usersService.findById(userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns a user by their ID (admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'User found', type: CreateUserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @SetMetadata('roles', [Role.ADMIN, Role.TEACHER])
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get()
  @SetMetadata('roles', [Role.ADMIN])
  async findUserByEmail(@Query('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Put(':id')
  @SetMetadata('roles', [Role.ADMIN])
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; roles?: Role[] },
  ) {
    return this.usersService.updateUser(id, body); // Нужно добавить метод в сервис
  }

  @Delete(':id')
  @SetMetadata('roles', [Role.ADMIN])
  async delete(@Param('id') id: string) {
    await this.usersService.deleteUser(id); // Теперь метод существует
    return { message: 'User deleted' };
  }

  // @Get()
  // async findUserByEmail(@Query('email') email: string) {
  //   return this.usersService.findByEmail(email);
  // }

  @Post(':id/groups/:groupId')
  @ApiOperation({ summary: 'Add user to group' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123' })
  @ApiParam({ name: 'groupId', description: 'Group ID', example: '456' })
  @ApiResponse({ status: 201, description: 'User added to group' })
  @ApiResponse({ status: 404, description: 'User or group not found' })
  @SetMetadata('roles', [Role.ADMIN])
  async addToGroup(@Param('id') id: string, @Param('groupId') groupId: string) {
    await this.groupsService.addStudent(groupId, id);
    return this.usersService.updateUser(id, { groups: { $addToSet: groupId } }); // Исправляем синтаксис
  }

  @Delete(':id/groups/:groupId')
  @SetMetadata('roles', [Role.ADMIN])
  async removeFromGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ) {
    await this.groupsService.removeStudent(groupId, id);
    return this.usersService.updateUser(id, { groups: { $pull: groupId } }); // Исправляем синтаксис
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN])
  async findAll() {
    return this.usersService.findAll();
  }
}
