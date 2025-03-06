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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
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
    return this.usersService.deleteUser(id); // Нужно добавить метод в сервис
  }

  // @Get()
  // async findUserByEmail(@Query('email') email: string) {
  //   return this.usersService.findByEmail(email);
  // }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN])
  async findAll() {
    return this.usersService.findAll();
  }
}
