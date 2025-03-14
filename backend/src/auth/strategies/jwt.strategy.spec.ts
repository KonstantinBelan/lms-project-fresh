import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../roles.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockUsersService = {
    findById: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn().mockReturnValue('secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('должен быть определен', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('должен возвращать валидированного пользователя', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        roles: [Role.STUDENT],
      };
      mockUsersService.findById.mockResolvedValue({
        _id: '1',
        email: 'test@example.com',
      });
      const result = await strategy.validate(payload);
      expect(result).toEqual({
        _id: '1',
        email: 'test@example.com',
        roles: [Role.STUDENT],
      });
    });

    it('должен выбрасывать UnauthorizedException, если пользователь не найден', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        roles: [Role.STUDENT],
      };
      mockUsersService.findById.mockResolvedValue(null);
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
