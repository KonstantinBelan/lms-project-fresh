import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  SetMetadata,
  UsePipes,
  ValidationPipe,
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

  // @Get('me')
  // @UseGuards(AuthGuard('jwt'))
  // async getMe(@Request() req) {
  //   console.log('User from JWT:', req.user); // Логируем req.user для диагностики
  //   return this.usersService.findById(req.user.sub); // Используем sub из JWT payload
  // }

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

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @SetMetadata('roles', [Role.ADMIN])
  async findAll() {
    return this.usersService.findAll();
  }
}
