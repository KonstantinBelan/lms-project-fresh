// backend/src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        role: 'STUDENT',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({
        _id: '1',
        email: 'test@example.com',
        role: 'STUDENT',
      });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        role: 'STUDENT',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      await expect(
        service.validateUser('test@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return JWT token for valid user', async () => {
      const user = { _id: '1', email: 'test@example.com', role: 'STUDENT' };
      mockJwtService.sign.mockReturnValue('jwt_token');
      const result = await service.login(user);
      expect(result).toEqual({ access_token: 'jwt_token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: '1',
        role: 'STUDENT',
      });
    });
  });
});
