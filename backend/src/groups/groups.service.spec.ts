import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UsersService } from '../users/users.service';
import { Group } from './schemas/group.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('GroupsService', () => {
  let service: GroupsService;
  let groupModel: any;
  let cacheManager: any;
  let usersService: any;

  const mockGroupModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: getModelToken(Group.name), useValue: mockGroupModel },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    groupModel = module.get(getModelToken(Group.name));
    cacheManager = module.get(CACHE_MANAGER);
    usersService = module.get(UsersService);
  });

  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('должен создать группу', async () => {
      const dto = { name: 'Группа 1', description: 'Описание' };
      const group = { ...dto, _id: '507f1f77bcf86cd799439011', students: [] };
      mockGroupModel.create.mockReturnValue({
        save: jest.fn().mockResolvedValue(group),
      });

      const result = await service.create(dto);
      expect(result).toEqual(group);
      expect(cacheManager.del).toHaveBeenCalledWith('groups:all');
    });
  });

  describe('findById', () => {
    it('должен вернуть группу из кэша', async () => {
      const group = { _id: '507f1f77bcf86cd799439011', name: 'Группа 1' };
      mockCacheManager.get.mockResolvedValue(group);

      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toEqual(group);
      expect(groupModel.findById).not.toHaveBeenCalled();
    });

    it('должен выбросить исключение при неверном ID', async () => {
      await expect(service.findById('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addStudent', () => {
    it('должен добавить студента в группу', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const studentId = '507f191e810c19729de860ea';
      const group = { _id: groupId, students: [], name: 'Группа 1' };
      const updatedGroup = { ...group, students: [studentId] };
      mockUsersService.findById.mockResolvedValue({ _id: studentId });
      mockGroupModel.findById.mockResolvedValue(group);
      mockGroupModel.findByIdAndUpdate.mockResolvedValue(updatedGroup);

      const result = await service.addStudent(groupId, studentId);
      expect(result).toEqual(updatedGroup);
      expect(cacheManager.del).toHaveBeenCalledWith(`group:${groupId}`);
    });

    it('должен выбросить исключение, если студент уже в группе', async () => {
      const groupId = '507f1f77bcf86cd799439011';
      const studentId = '507f191e810c19729de860ea';
      const group = { _id: groupId, students: [studentId], name: 'Группа 1' };
      mockUsersService.findById.mockResolvedValue({ _id: studentId });
      mockGroupModel.findById.mockResolvedValue(group);

      await expect(service.addStudent(groupId, studentId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
