import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../roles.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// Интерфейсы
interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  iat: number;
  exp: number;
}

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    const cacheKey = `jwt_user_${payload.sub}`;
    const cachedUser = await this.cacheManager.get<ValidatedUser>(cacheKey);
    if (cachedUser) {
      this.logger.debug(`Пользователь ${payload.email} найден в кэше`);
      return cachedUser;
    }

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
    await this.cacheManager.set(cacheKey, result, 3600); // Кэшируем на 1 час
    this.logger.debug(`Токен успешно валидирован для ${payload.email}`);
    return result;
  }
}
