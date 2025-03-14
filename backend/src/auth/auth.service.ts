import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { Role } from './roles.enum';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { Types } from 'mongoose';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as crypto from 'crypto';

// Интерфейс для ответа при регистрации
interface SignupResponse extends User {}

// Интерфейс для валидированного пользователя
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
  ) {}

  async validateUser(email: string, pass: string): Promise<ValidatedUser> {
    this.logger.debug(`Валидация пользователя: ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      this.logger.warn(`Неверные учетные данные для ${email}`);
      throw new UnauthorizedException('Неверные учетные данные');
    }
    const { password, ...result } = user;
    this.logger.log(`Успешная валидация для ${email}`);
    return result;
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
      sub: validatedUser._id.toString(),
      email: validatedUser.email,
      roles: validatedUser.roles,
    };
    const token = this.jwtService.sign(payload);
    this.logger.log(`JWT-токен сгенерирован для ${email}`);
    return { access_token: token };
  }

  async generateResetToken(email: string): Promise<string> {
    this.logger.log(`Генерация токена сброса для ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Пользователь ${email} не найден`);
      throw new UnauthorizedException('Пользователь не найден');
    }
    const token = crypto.randomBytes(8).toString('hex'); // Более безопасный токен
    const expiresAt = Date.now() + 3600000; // Токен действителен 1 час
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
    this.logger.log(`Токен ${token} отправлен на ${email}`);
    return token;
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    this.logger.log(`Сброс пароля для ${email}`);
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
    this.logger.log(`Пароль успешно сброшен для ${email}`);
  }
}
