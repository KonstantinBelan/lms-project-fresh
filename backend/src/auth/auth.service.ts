import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { Role } from './roles.enum';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// Интерфейсы
interface SignupResponse extends User {}
interface ValidatedUser {
  _id: string;
  email: string;
  roles: Role[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateUser(email: string, pass: string): Promise<ValidatedUser> {
    this.logger.debug(`Валидация пользователя: ${email}`);
    const cacheKey = `validate_user_${email}`;
    const cachedUser = await this.cacheManager.get<ValidatedUser>(cacheKey);
    if (cachedUser) {
      this.logger.debug(`Пользователь ${email} найден в кэше`);
      return cachedUser;
    }

    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      this.logger.warn(`Неверные учетные данные для ${email}`);
      throw new UnauthorizedException('Неверные учетные данные');
    }
    const { password, ...result } = user;
    const validatedUser: ValidatedUser = {
      _id: result._id.toString(), // Приводим ObjectId к строке
      email: result.email,
      roles: result.roles,
    };
    await this.cacheManager.set(cacheKey, validatedUser, 3600); // Кэшируем на 1 час
    this.logger.log(`Успешная валидация для ${email}`);
    return validatedUser;
  }

  async signUp(
    email: string,
    password: string,
    roles: Role[] = [Role.STUDENT],
    name?: string,
  ): Promise<SignupResponse> {
    this.logger.log(`Регистрация нового пользователя: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.usersService.create({
      email,
      password: hashedPassword,
      roles,
      name,
    });
    this.logger.log(`Пользователь ${email} успешно зарегистрирован`);
    return newUser;
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    this.logger.log(`Вход пользователя: ${email}`);
    const validatedUser = await this.validateUser(email, password);
    const payload = {
      sub: validatedUser._id,
      email: validatedUser.email,
      roles: validatedUser.roles,
    };
    const token = this.jwtService.sign(payload);
    this.logger.log(`JWT-токен сгенерирован для ${email}`);
    return { access_token: token };
  }

  async generateResetToken(email: string): Promise<string> {
    this.logger.log(`Генерация токена сброса для ${email}`);
    const cacheKey = `reset_token_${email}`;
    const cachedToken = await this.cacheManager.get<string>(cacheKey);
    if (cachedToken) {
      this.logger.debug(`Токен для ${email} найден в кэше`);
      return cachedToken;
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Пользователь ${email} не найден`);
      throw new UnauthorizedException('Пользователь не найден');
    }
    const token = crypto.randomBytes(8).toString('hex');
    const expiresAt = Date.now() + 3600000;
    await this.usersService.updateUser(user._id.toString(), {
      settings: {
        notifications: user.settings?.notifications ?? true,
        language: user.settings?.language ?? 'en',
        resetToken: token,
        resetTokenExpires: expiresAt,
      },
    });
    await this.transporter.sendMail({
      to: email,
      subject: 'Сброс пароля',
      text: `Ваш токен сброса: ${token}. Он действителен в течение 1 часа.`,
    });
    await this.cacheManager.set(cacheKey, token, 3600);
    this.logger.log(`Токен ${token} отправлен на ${email}`);
    return token;
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    this.logger.log(`Сброс пароля для ${email}`);
    const cacheKey = `reset_token_${email}`;
    const cachedToken = await this.cacheManager.get<string>(cacheKey);
    if (cachedToken && cachedToken !== token) {
      this.logger.warn(`Неверный токен из кэша для ${email}`);
      throw new UnauthorizedException('Неверный или просроченный токен');
    }

    const user = await this.usersService.findByEmail(email);
    if (
      !user ||
      user.settings?.resetToken !== token ||
      (user.settings?.resetTokenExpires &&
        user.settings.resetTokenExpires < Date.now())
    ) {
      this.logger.warn(`Неверный или просроченный токен для ${email}`);
      throw new UnauthorizedException('Неверный или просроченный токен');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updateUser(user._id.toString(), {
      password: hashedPassword,
      settings: {
        notifications: user.settings?.notifications ?? true,
        language: user.settings?.language ?? 'en',
        resetToken: undefined,
        resetTokenExpires: undefined,
      },
    });
    await this.cacheManager.del(cacheKey);
    this.logger.log(`Пароль успешно сброшен для ${email}`);
  }
}
