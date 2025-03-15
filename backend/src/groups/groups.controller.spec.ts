import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;

  const mockGroupsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    addStudent: jest.fn(),
    removeStudent: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [{ provide: GroupsService, useValue: mockGroupsService }],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);
  });

  it('должен быть определен', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('должен создать группу', async () => {
      const dto = { name: 'Группа 1' };
      const group = { _id: '507f1f77bcf86cd799439011', ...dto, students: [] };
      mockGroupsService.create.mockResolvedValue(group);

      const result = await controller.create(dto);
      expect(result._id).toBe(group._id);
    });
  });

  describe('findAll', () => {
    it('должен вернуть список групп', async () => {
      const groups = [
        { _id: '507f1f77bcf86cd799439011', name: 'Группа 1', students: [] },
      ];
      mockGroupsService.findAll.mockResolvedValue({ groups, total: 1 });

      const result = await controller.findAll(0, 10, 'name', 'asc');
      expect(result.groups).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('addStudent', () => {
    it('должен добавить студента в группу', async () => {
      const group = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Группа 1',
        students: ['507f191e810c19729de860ea'],
      };
      mockGroupsService.addStudent.mockResolvedValue(group);

      const result = await controller.addStudent(group._id, group.students[0]);
      expect(result.students).toContain(group.students[0]);
    });
  });
});
