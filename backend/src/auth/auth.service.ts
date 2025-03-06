// backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
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

  // async validateUser(email: string, pass: string): Promise<any> {
  //   console.log('Validating user:', { email, pass });
  //   console.log('Raw password bytes:', Buffer.from(pass, 'utf8'));
  //   console.log('Bcrypt version:', bcrypt.version);
  //   const user = await this.usersService.findByEmail(email);
  //   console.log('User found:', user);

  //   if (!user) {
  //     console.error('User not found:', { email });
  //     return null;
  //   }

  //   const passwordMatch = await bcrypt.compare(pass, user.password);
  //   console.log('Password comparison result (detailed):', {
  //     match: passwordMatch,
  //     input: pass,
  //     inputLength: pass.length,
  //     stored: user.password,
  //   });

  //   if (passwordMatch) {
  //     const { password, ...result } = user;
  //     return result;
  //   }
  //   console.error('Invalid password for user:', {
  //     email,
  //     inputPass: pass,
  //     storedPass: user.password,
  //   });
  //   return null;
  // }
  async validateUser(email: string, pass: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user || !(await bcrypt.compare(pass, user.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException('Validation failed');
    }
  }

  async signUp(
    email: string,
    password: string,
    roles: Role[] = [Role.STUDENT],
    name?: string,
  ): Promise<User> {
    console.log('Processing signup:', { email, roles, name });
    const hashedPassword = await bcrypt.hash(password, 10); // Хэшируем здесь
    console.log('Hashed password in signUp:', hashedPassword);
    const newUser = await this.usersService.create({
      email,
      password: hashedPassword, // Передаём хэшированный пароль
      roles,
      name,
    });
    return newUser;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    // console.log('Login attempt:', { email, password });
    const validatedUser = await this.validateUser(email, password);
    if (!validatedUser) {
      console.error('Validation failed for:', { email });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: (validatedUser._id as Types.ObjectId).toString(),
      roles: validatedUser.roles,
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
    const hashedPassword = await bcrypt.hash(password, 10); // Хэшируем здесь
    console.log('Hashed password in register:', hashedPassword);
    const user = await this.usersService.create({
      email,
      password: hashedPassword, // Передаём хэшированный пароль
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
