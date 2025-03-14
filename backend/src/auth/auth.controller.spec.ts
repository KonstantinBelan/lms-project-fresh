import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    signUp: jest.fn(),
    generateResetToken: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('должен возвращать JWT-токен', async () => {
      const result = { access_token: 'jwt_token' };
      mockAuthService.login.mockResolvedValue(result);
      expect(
        await controller.login({
          email: 'test@example.com',
          password: 'password',
        }),
      ).toBe(result);
    });
  });

  describe('signup', () => {
    it('должен регистрировать пользователя', async () => {
      const user = { _id: '1', email: 'test@example.com', roles: ['STUDENT'] };
      mockAuthService.signUp.mockResolvedValue(user);
      const result = await controller.signup({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toEqual({
        message: 'Пользователь зарегистрирован',
        userId: '1',
      });
    });
  });

  describe('forgotPassword', () => {
    it('должен отправлять токен сброса', async () => {
      mockAuthService.generateResetToken.mockResolvedValue('abc123');
      const result = await controller.forgotPassword({
        email: 'test@example.com',
      });
      expect(result).toEqual({
        message: 'Токен сброса отправлен на ваш email',
      });
    });
  });

  describe('resetPassword', () => {
    it('должен сбрасывать пароль', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);
      const result = await controller.resetPassword({
        email: 'test@example.com',
        token: 'abc123',
        newPassword: 'newPassword',
      });
      expect(result).toEqual({ message: 'Пароль успешно сброшен' });
    });
  });
});
