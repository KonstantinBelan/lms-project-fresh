import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema'; // Используем User для lean()
import { Role } from './roles.enum';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { Types } from 'mongoose';

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

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    console.log('Login attempt:', { email, password }); // Лог входных данных
    const user = await this.usersService.findByEmail(email);
    console.log('User retrieved:', user);

    if (!user) {
      console.error('User not found in login:', { email });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      console.error('Password missing for user:', { email, user });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', {
      match: passwordMatch,
      input: password,
      stored: user.password,
    });

    if (!passwordMatch) {
      console.error('Password mismatch:', {
        email,
        input: password,
        stored: user.password,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: (user._id as Types.ObjectId).toString(),
      roles: user.roles,
    };
    console.log('Generating token with payload:', payload);
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<User> {
    console.log('Registering user:', { email, name });
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
    });
    console.log('Registered user:', user);
    return user;
  }

  async generateResetToken(email: string): Promise<string> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');
    const token = Math.random().toString(36).slice(-8);
    await this.usersService.updateUser(
      (user._id as Types.ObjectId).toString(),
      {
        settings: {
          notifications: user.settings?.notifications ?? true,
          language: user.settings?.language ?? 'en',
          resetToken: token,
        },
      },
    );
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
    if (!user || user.settings?.resetToken !== token) {
      throw new UnauthorizedException('Invalid token');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updateUser(
      (user._id as Types.ObjectId).toString(),
      {
        password: hashedPassword,
        settings: {
          notifications: user.settings?.notifications ?? true,
          language: user.settings?.language ?? 'en',
          resetToken: undefined,
        },
      },
    );
  }
}
