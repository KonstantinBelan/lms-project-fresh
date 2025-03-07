import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './roles.enum';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Types } from 'mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  @ApiOperation({
    summary: 'Forgot Password',
    description: "Generates a reset token and sends it to the user's email.",
  })
  @ApiResponse({
    status: 200,
    description: 'Reset token sent to your email',
    schema: {
      example: { message: 'Reset token sent to your email' },
    },
  })
  async forgotPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    await this.authService.generateResetToken(email);
    return { message: 'Reset token sent to your email' };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset Password',
    description: "Resets the user's password using the provided token.",
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      example: { message: 'Password reset successful' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token or email',
  })
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
  @ApiOperation({
    summary: 'Sign Up',
    description: 'Registers a new user with the given details.',
  })
  @ApiResponse({
    status: 201,
    description: 'User signed up successfully',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data',
  })
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
