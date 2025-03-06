// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

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
  });

  afterEach(() => jest.clearAllMocks());

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        roles: ['STUDENT'],
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({
        _id: '1',
        email: 'test@example.com',
        roles: ['STUDENT'],
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      const user = { _id: '1', email: 'test@example.com', roles: ['STUDENT'] };
      mockUsersService.findByEmail.mockResolvedValue({
        ...user,
        password: await bcrypt.hash('password', 10),
      });
      mockJwtService.sign.mockReturnValue('jwt_token');
      const result = await service.login('test@example.com', 'password');
      expect(result).toEqual({ access_token: 'jwt_token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        roles: ['STUDENT'],
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
