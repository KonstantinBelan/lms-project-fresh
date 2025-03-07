import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './roles.enum';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Types } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // @Post('login')
  // async login(
  //   @Body() body: { email: string; password: string },
  // ): Promise<{ access_token: string }> {
  //   return this.authService.login(body.email, body.password);
  // }
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates a user and returns a JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: String,
    example: 'jwt_token_here',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
  // @Post('login')
  // @UsePipes(new ValidationPipe({ transform: true }))
  // async login(@Body() loginDto: LoginDto) {
  //   return this.authService.login(loginDto);
  // }

  // @Post('register')
  // async register(
  //   @Body() body: { email: string; password: string; name?: string },
  // ): Promise<{ message: string; userId: string }> {
  //   const user = await this.authService.register(
  //     body.email,
  //     body.password,
  //     body.name,
  //   ); // Убираем приведение к UserDocument
  //   return {
  //     message: 'User registered',
  //     userId: (user._id as Types.ObjectId).toString(),
  //   }; // Явно указываем _id как Types.ObjectId
  // }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with provided details.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string; userId: string }> {
    const user = await this.authService.register(
      createUserDto.email,
      createUserDto.password,
      createUserDto.name,
    );
    return {
      message: 'User registered',
      userId: (user._id as Types.ObjectId).toString(),
    };
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
  async signup(
    @Body()
    createUserDto: {
      email: string;
      password: string;
      roles?: Role[];
      name?: string;
    },
  ) {
    console.log('Signing up user:', createUserDto);
    return this.authService.signUp(
      createUserDto.email,
      createUserDto.password,
      createUserDto.roles || [Role.STUDENT],
      createUserDto.name,
    );
  }
}
