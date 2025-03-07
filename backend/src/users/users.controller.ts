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
  Req,
  SetMetadata,
  UsePipes,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ConnectTelegramDto } from './dto/connect-telegram.dto';
import { Role } from '../auth/roles.enum';
import { GroupsService } from '../groups/groups.service';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Определяем тип RequestWithUser
interface RequestWithUser extends Request {
  user: { sub?: string; _id?: string }; // Тип зависит от твоего JWT payload
}

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
      roles: createUserDto.roles || [Role.STUDENT],
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Current user retrieved',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req) {
    console.log('User from JWT:', req.user);
    const userId = req.user?.sub || req.user?._id;
    if (!userId) {
      console.error('No user ID found in JWT payload:', req.user);
      throw new Error('Invalid user ID in token');
    }
    return this.usersService.findById(userId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'All users retrieved',
    type: [CreateUserDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN])
  async findAll() {
    return this.usersService.findAll();
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

  @Get('email/:email')
  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @SetMetadata('roles', [Role.ADMIN])
  async findUserByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SetMetadata('roles', [Role.ADMIN])
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; roles?: Role[] },
  ) {
    return this.usersService.updateUser(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    schema: {
      example: { message: 'User deleted' },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @SetMetadata('roles', [Role.ADMIN])
  async delete(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted' };
  }

  @Post(':id/groups/:groupId')
  @ApiOperation({ summary: 'Add user to group' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123' })
  @ApiParam({ name: 'groupId', description: 'Group ID', example: '456' })
  @ApiResponse({ status: 201, description: 'User added to group' })
  @ApiResponse({ status: 404, description: 'User or group not found' })
  @SetMetadata('roles', [Role.ADMIN])
  async addToGroup(@Param('id') id: string, @Param('groupId') groupId: string) {
    await this.groupsService.addStudent(groupId, id);
    return this.usersService.updateUser(id, { groups: { $addToSet: groupId } });
  }

  @Delete(':id/groups/:groupId')
  @ApiOperation({ summary: 'Remove user from group' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123' })
  @ApiParam({ name: 'groupId', description: 'Group ID', example: '456' })
  @ApiResponse({
    status: 200,
    description: 'User removed from group',
    schema: {
      example: { message: 'User removed from group' },
    },
  })
  @ApiResponse({ status: 404, description: 'User or group not found' })
  @SetMetadata('roles', [Role.ADMIN])
  async removeFromGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
  ) {
    await this.groupsService.removeStudent(groupId, id);
    return this.usersService.updateUser(id, { groups: { $pull: groupId } });
  }

  @Patch('me/telegram')
  @ApiOperation({
    summary: 'Connect Telegram account',
    description: `
    Links a Telegram chat ID to the user profile to receive notifications.
    
    **How to get your Telegram chat ID:**
    1. Open Telegram and search for the bot @LMSNotificationBot.
    2. Send the command /start to the bot.
    3. The bot will reply with your chat ID (e.g., 123456789).
    4. Copy this chat ID and use it in the 'telegramId' field below.
    5. Send a PATCH request with your chat ID to this endpoint.
    
    Example: { "telegramId": "123456789" }
  `,
  })
  @ApiResponse({
    status: 200,
    description: 'Telegram connected',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe())
  async connectTelegram(
    @Req() req: RequestWithUser,
    @Body() connectDto: ConnectTelegramDto,
  ) {
    const userId = req.user?.sub || req.user?._id;
    if (!userId) {
      throw new Error('Invalid user ID in token');
    }
    return this.usersService.updateUser(userId, {
      telegramId: connectDto.telegramId,
    });
  }
}
