import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Role } from './roles.enum';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // @Post('login')
  // async login(@Body() loginDto: { email: string; password: string }) {
  //   console.log('Login attempt:', loginDto);
  //   const user = await this.authService.validateUser(
  //     loginDto.email,
  //     loginDto.password,
  //   );
  //   console.log('Login request body:', JSON.stringify(loginDto, null, 2));
  //   if (!user) {
  //     console.error('Login failed: Invalid credentials for', loginDto.email);
  //     throw new Error('Invalid credentials');
  //   }
  //   return this.authService.login(user);
  // }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<{ access_token: string }> {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name?: string },
  ): Promise<{ message: string; userId: string }> {
    const user = await this.authService.register(
      body.email,
      body.password,
      body.name,
    );
    return { message: 'User registered', userId: user._id.toString() };
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    await this.authService.generateResetToken(email);
    return { message: 'Reset token sent to your email' };
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; token: string; newPassword: string },
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(
      body.email,
      body.token,
      body.newPassword,
    );
    return { message: 'Password reset successful' };
  }

  @Post('signup')
  @UsePipes(new ValidationPipe())
  async signup(@Body() createUserDto: CreateUserDto) {
    console.log('Signing up user:', createUserDto);
    return this.authService.signUp(
      createUserDto.email,
      createUserDto.password,
      createUserDto.roles || [Role.STUDENT],
      createUserDto.name,
    );
  }
}
