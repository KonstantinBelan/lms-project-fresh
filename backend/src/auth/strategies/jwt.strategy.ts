import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../roles.enum';

// Интерфейс для payload JWT-токена
interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  iat: number;
  exp: number;
}

// Интерфейс для валидированного пользователя
interface ValidatedUser {
  _id: string;
  email: string;
  roles: Role[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET не задан в конфигурации');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    this.logger.debug(`Валидация JWT-токена для email: ${payload.email}`);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      this.logger.warn(`Пользователь с ID ${payload.sub} не найден`);
      throw new UnauthorizedException('Пользователь не найден');
    }
    const result: ValidatedUser = {
      _id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
    this.logger.debug(`Токен успешно валидирован для ${payload.email}`);
    return result;
  }
}
