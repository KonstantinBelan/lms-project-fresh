import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../roles.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { email: string; sub: string; roles: Role[] }) {
    this.logger.debug('Валидация JWT-токена:', payload);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      this.logger.warn(`Пользователь с ID ${payload.sub} не найден`);
      throw new UnauthorizedException('Пользователь не найден');
    }
    return { _id: payload.sub, email: payload.email, roles: payload.roles };
  }
}
