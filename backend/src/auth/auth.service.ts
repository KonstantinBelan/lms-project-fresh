import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { Role } from './roles.enum';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { Types } from 'mongoose';
import { AuthResponseDto } from './dto/auth-response.dto';

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

  async validateUser(email: string, pass: string): Promise<any> {
    this.logger.debug(`Валидация пользователя: ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      this.logger.warn(`Неверные учетные данные для ${email}`);
      throw new UnauthorizedException('Неверные учетные данные');
    }
    const { password, ...result } = user; // Убираем .toObject(), так как .lean() уже возвращает объект
    return result;
  }

  async signUp(
    email: string,
    password: string,
    roles: Role[] = [Role.STUDENT],
    name?: string,
  ): Promise<User> {
    this.logger.log(`Регистрация нового пользователя: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.usersService.create({
      email,
      password: hashedPassword,
      roles,
      name,
    });
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
    return { access_token: this.jwtService.sign(payload) };
  }

  async generateResetToken(email: string): Promise<string> {
    this.logger.log(`Генерация токена сброса для ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Пользователь ${email} не найден`);
      throw new UnauthorizedException('Пользователь не найден');
    }
    const token = Math.random().toString(36).slice(-8);
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
        resetToken: undefined, // Используем undefined вместо null
        resetTokenExpires: undefined, // Используем undefined вместо null
      },
    });
  }
}
