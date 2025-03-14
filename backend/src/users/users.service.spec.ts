import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  const mockUserModel = {
    find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    findOne: jest
      .fn()
      .mockReturnValue({ exec: jest.fn(), select: jest.fn().mockReturnThis() }),
    findById: jest
      .fn()
      .mockReturnValue({ exec: jest.fn(), lean: jest.fn().mockReturnThis() }),
    findByIdAndUpdate: jest
      .fn()
      .mockReturnValue({ exec: jest.fn(), lean: jest.fn().mockReturnThis() }),
    findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
  };
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: 'CACHE_MANAGER', useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('должен создать нового пользователя', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        password: 'hashed',
        roles: ['STUDENT'],
      };
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockUserModel.prototype.save = jest
        .fn()
        .mockResolvedValue({ ...user, toObject: () => user });
      const result = await service.create({
        email: 'test@example.com',
        password: 'hashed',
      });
      expect(result).toEqual(user);
    });

    it('должен выбросить ошибку, если email уже существует', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });
      await expect(
        service.create({ email: 'test@example.com', password: 'hashed' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('должен найти пользователя по ID', async () => {
      const user = { _id: '1', email: 'test@example.com' };
      mockUserModel.findById.mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) }),
      });
      const result = await service.findById('1');
      expect(result).toEqual(user);
    });

    it('должен выбросить ошибку при некорректном ID', async () => {
      await expect(service.findById('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateUser', () => {
    it('должен обновить пользователя', async () => {
      const user = { _id: '1', email: 'test@example.com', name: 'New Name' };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) }),
      });
      const result = await service.updateUser('1', { name: 'New Name' });
      expect(result).toEqual(user);
    });

    it('должен выбросить ошибку, если пользователь не найден', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });
      await expect(
        service.updateUser('1', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
