import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { Role } from './roles.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
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

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
