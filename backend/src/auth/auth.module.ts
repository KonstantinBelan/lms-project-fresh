import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './guards/roles.guard';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    UsersModule, // Модуль для работы с пользователями
    PassportModule, // Модуль для интеграции Passport (аутентификация)
    ConfigModule, // Модуль для работы с конфигурацией
    CacheModule.register(), // Модуль для кэширования
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'HC0aOtYAW4VI6N0gNO0MllUdrDyBUnZMnVM9BwBfwPaypWQBxO7PPCrUL7auhJsP',
        signOptions: { expiresIn: '1h' }, // Настройки срока действия токена
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
})
export class AuthModule {}
