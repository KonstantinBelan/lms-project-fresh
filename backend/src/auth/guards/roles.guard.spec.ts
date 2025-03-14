import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '../roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (user: any, roles?: Role[]): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('должен быть определен', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('должен разрешать доступ, если роли не указаны', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = mockExecutionContext({
        _id: '1',
        email: 'test@example.com',
        roles: [Role.STUDENT],
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('должен запрещать доступ, если пользователь не аутентифицирован', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const context = mockExecutionContext(undefined);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('должен разрешать доступ, если у пользователя есть требуемая роль', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const context = mockExecutionContext({
        _id: '1',
        email: 'test@example.com',
        roles: [Role.ADMIN],
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('должен запрещать доступ, если у пользователя нет требуемой роли', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const context = mockExecutionContext({
        _id: '1',
        email: 'test@example.com',
        roles: [Role.STUDENT],
      });
      expect(guard.canActivate(context)).toBe(false);
    });
  });
});
