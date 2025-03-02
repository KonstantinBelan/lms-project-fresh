import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('Validating user with email:', email);
    const user = await this.usersService.findByEmail(email);
    console.log('Found user:', user);
    if (user && (await bcrypt.compare(password, user.password))) {
      console.log('Password matches');
      const { password, ...result } = user;
      return { ...result, role: user.role }; // Убедились, что возвращаем email, _id, role
    }
    console.log('Invalid credentials: user or password mismatch');
    return null;
  }

  async login(user: any) {
    console.log('Logging in user:', user); // Для отладки
    const payload = {
      email: user._doc?.email || user.email, // Используем _doc, если доступен, или напрямую email
      sub: user._doc?._id?.toString() || user._id?.toString(), // Преобразуем _id в строку
      role: user.role, // role уже доступен напрямую
    };
    console.log('Payload for token:', payload); // Для отладки
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
