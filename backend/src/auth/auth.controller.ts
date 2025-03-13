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
import { ForgotPasswordDto } from './dto/forgot-password.dto'; // Новый DTO
import { ResetPasswordDto } from './dto/reset-password.dto'; // Новый DTO
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
  })
  @ApiResponse({
    status: 401,
    description: 'Доступ запрещен - неверные учетные данные',
  })
  @UsePipes(new ValidationPipe())
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Попытка входа для email: ${loginDto.email}`);
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('signup')
  @ApiOperation({
    summary: 'Регистрация нового пользователя',
    description: 'Создает нового пользователя с указанными данными.',
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: {
      example: {
        message: 'Пользователь зарегистрирован',
        userId: '507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
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
    schema: { example: { message: 'Токен сброса отправлен на ваш email' } },
  })
  @UsePipes(new ValidationPipe())
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Запрос сброса пароля для email: ${forgotPasswordDto.email}`,
    );
    await this.authService.generateResetToken(forgotPasswordDto.email);
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
    schema: { example: { message: 'Пароль успешно сброшен' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Доступ запрещен - неверный токен или email',
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
    return { message: 'Пароль успешно сброшен' };
  }
}
