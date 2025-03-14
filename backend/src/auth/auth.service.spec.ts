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
    create: jest.fn(),
    updateUser: jest.fn(),
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
    it('должен вернуть пользователя без пароля при валидных учетных данных', async () => {
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

    it('должен выбросить UnauthorizedException при неверных учетных данных', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('должен вернуть JWT-токен при валидных учетных данных', async () => {
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
        email: 'test@example.com',
        roles: ['STUDENT'],
      });
    });

    it('должен выбросить UnauthorizedException при неверных учетных данных', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp', () => {
    it('должен создать нового пользователя с хэшированным паролем', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        password: 'hashed_password',
        roles: ['STUDENT'],
      };
      mockUsersService.create.mockResolvedValue(user);
      const result = await service.signUp('test@example.com', 'password');
      expect(result).toEqual(user);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: expect.any(String),
        roles: ['STUDENT'],
      });
    });
  });

  describe('generateResetToken', () => {
    it('должен сгенерировать токен и отправить email', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        settings: { notifications: true, language: 'en' },
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.updateUser.mockResolvedValue(true);
      const transporterSpy = jest
        .spyOn((service as any).transporter, 'sendMail')
        .mockResolvedValue(true);
      const token = await service.generateResetToken('test@example.com');
      expect(token).toBeDefined();
      expect(mockUsersService.updateUser).toHaveBeenCalled();
      expect(transporterSpy).toHaveBeenCalled();
    });

    it('должен выбросить исключение, если пользователь не найден', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.generateResetToken('test@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('должен сбросить пароль при валидном токене', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        settings: {
          resetToken: 'abc123',
          resetTokenExpires: Date.now() + 3600000,
        },
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.updateUser.mockResolvedValue(true);
      await service.resetPassword('test@example.com', 'abc123', 'newPassword');
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ password: expect.any(String) }),
      );
    });

    it('должен выбросить исключение при неверном токене', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        settings: {
          resetToken: 'xyz789',
          resetTokenExpires: Date.now() + 3600000,
        },
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      await expect(
        service.resetPassword('test@example.com', 'abc123', 'newPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
