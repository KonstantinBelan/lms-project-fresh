import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { Role } from './roles.enum';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log('Validating user:', { email, pass });
    console.log('Bcrypt version:', bcrypt.version);
    const user = await this.usersService.findByEmail(email);
    console.log('User found:', user);

    if (!user) {
      console.error('User not found:', { email });
      return null;
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);
    console.log('Password comparison result (detailed):', {
      match: passwordMatch,
      input: pass,
      stored: user.password,
    });

    if (passwordMatch) {
      const { password, ...result } = user;
      return result;
    }
    console.error('Invalid password for user:', {
      email,
      inputPass: pass,
      storedPass: user.password,
    });
    return null;
  }

  async signUp(
    email: string,
    password: string,
    roles: Role[] = [Role.STUDENT],
    name?: string,
  ): Promise<User> {
    console.log('Processing signup:', { email, roles, name });
    const newUser = await this.usersService.create({
      email,
      password,
      roles,
      name,
    });
    return newUser;
  }

  // async login(user: any) {
  //   console.log('Logging in user:', user); // Логируем user для диагностики
  //   const payload = { email: user.email, sub: user._id, roles: user.roles };
  //   return {
  //     access_token: this.jwtService.sign(payload),
  //   };
  // }
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user._id, roles: user.roles };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({ email, password: hashedPassword, name });
  }

  async generateResetToken(email: string): Promise<string> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');
    const token = Math.random().toString(36).slice(-8); // Простой токен для примера
    await this.usersService.updateUser(user._id.toString(), {
      settings: { ...user.settings, resetToken: token },
    });
    await this.transporter.sendMail({
      to: email,
      subject: 'Password Reset',
      text: `Your reset token is: ${token}`,
    });
    return token;
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.settings?.resetToken !== token)
      throw new UnauthorizedException('Invalid token');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updateUser(user._id.toString(), {
      password: hashedPassword,
      settings: { ...user.settings, resetToken: null },
    });
  }
}
