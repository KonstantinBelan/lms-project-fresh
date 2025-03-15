import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { GroupsService } from '../groups/groups.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };
  const mockGroupsService = {
    addStudent: jest.fn(),
    removeStudent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: GroupsService, useValue: mockGroupsService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => jest.clearAllMocks());

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('должен создать пользователя', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const user = { _id: '1', ...dto, roles: ['STUDENT'] };
      mockUsersService.create.mockResolvedValue(user);
      const result = await controller.create(dto);
      expect(result).toEqual(
        expect.objectContaining({ _id: '1', email: dto.email }),
      );
    });
  });

  describe('getMe', () => {
    it('должен вернуть текущего пользователя', async () => {
      const user = { _id: '1', email: 'test@example.com' };
      mockUsersService.findById.mockResolvedValue(user);
      const result = await controller.getMe({ user: { sub: '1' } } as any);
      expect(result).toEqual(expect.objectContaining({ _id: '1' }));
    });

    it('должен выбросить ошибку при отсутствии userId', async () => {
      await expect(controller.getMe({ user: {} } as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('должен вернуть список пользователей', async () => {
      const users = [{ _id: '1', email: 'test@example.com' }];
      mockUsersService.findAll.mockResolvedValue({ users, total: 1 });
      const result = await controller.findAll();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('delete', () => {
    it('должен удалить пользователя', async () => {
      mockUsersService.deleteUser.mockResolvedValue(undefined);
      const result = await controller.delete('1');
      expect(result).toEqual({ message: 'Пользователь удален' });
    });

    it('должен выбросить ошибку, если пользователь не найден', async () => {
      mockUsersService.deleteUser.mockRejectedValue(new NotFoundException());
      await expect(controller.delete('1')).rejects.toThrow(NotFoundException);
    });
  });
});
