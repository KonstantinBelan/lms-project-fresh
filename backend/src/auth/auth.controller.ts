import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './roles.enum';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post('login')
  @ApiOperation({
    summary: 'Вход пользователя',
    description: 'Аутентифицирует пользователя и возвращает JWT-токен.',
  })
  @ApiResponse({
    status: 200,
    description: 'Вход успешен, возвращен JWT-токен',
    type: AuthResponseDto,
    example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
  })
  @ApiResponse({
    status: 401,
    description: 'Доступ запрещен - неверные учетные данные',
    example: { message: 'Неверные учетные данные', statusCode: 401 },
  })
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Попытка входа для email: ${loginDto.email}`);
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    this.logger.log(`Успешный вход для email: ${loginDto.email}`);
    return result;
  }

  @Post('signup')
  @ApiOperation({
    summary: 'Регистрация нового пользователя',
    description: 'Создает нового пользователя с указанными данными.',
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    example: {
      message: 'Пользователь зарегистрирован',
      userId: '507f1f77bcf86cd799439011',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
    example: { message: 'Некорректный формат email', statusCode: 400 },
  })
  @UsePipes(new ValidationPipe())
  async signup(
    @Body()
    body: {
      email: string;
      password: string;
      roles?: Role[];
      name?: string;
    },
  ): Promise<{ message: string; userId: string }> {
    this.logger.log(`Регистрация пользователя с email: ${body.email}`);
    const user = await this.authService.signUp(
      body.email,
      body.password,
      body.roles || [Role.STUDENT],
      body.name,
    );
    this.logger.log(`Пользователь ${body.email} успешно зарегистрирован`);
    return {
      message: 'Пользователь зарегистрирован',
      userId: user._id.toString(),
    };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Забыл пароль',
    description:
      'Генерирует токен сброса и отправляет его на email пользователя.',
  })
  @ApiResponse({
    status: 200,
    description: 'Токен сброса отправлен на email',
    example: { message: 'Токен сброса отправлен на ваш email' },
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не найден',
    example: { message: 'Пользователь не найден', statusCode: 401 },
  })
  @UsePipes(new ValidationPipe())
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Запрос сброса пароля для email: ${forgotPasswordDto.email}`,
    );
    await this.authService.generateResetToken(forgotPasswordDto.email);
    this.logger.log(
      `Токен сброса отправлен для email: ${forgotPasswordDto.email}`,
    );
    return { message: 'Токен сброса отправлен на ваш email' };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Сброс пароля',
    description: 'Сбрасывает пароль пользователя с использованием токена.',
  })
  @ApiResponse({
    status: 200,
    description: 'Пароль успешно сброшен',
    example: { message: 'Пароль успешно сброшен' },
  })
  @ApiResponse({
    status: 401,
    description: 'Доступ запрещен - неверный токен или email',
    example: { message: 'Неверный или просроченный токен', statusCode: 401 },
  })
  @UsePipes(new ValidationPipe())
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Сброс пароля для email: ${resetPasswordDto.email}`);
    await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    this.logger.log(
      `Пароль успешно сброшен для email: ${resetPasswordDto.email}`,
    );
    return { message: 'Пароль успешно сброшен' };
  }
}
