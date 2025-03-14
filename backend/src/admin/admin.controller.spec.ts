import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetCoursesDto } from './dto/get-courses.dto';
import { GetEnrollmentsDto } from './dto/get-enrollments.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { GetActivityDto } from './dto/get-activity.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getUsers: jest.fn(),
    getCourses: jest.fn(),
    getEnrollments: jest.fn(),
    getNotifications: jest.fn(),
    getActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        {
          provide: AuthGuard('jwt'),
          useValue: { canActivate: jest.fn(() => true) },
        },
        { provide: RolesGuard, useValue: { canActivate: jest.fn(() => true) } },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('должен возвращать список пользователей с пагинацией', async () => {
      const result = {
        users: [{ _id: '1', email: 'user@example.com' }],
        total: 1,
      };
      mockAdminService.getUsers.mockResolvedValue(result);

      const response = await controller.getUsers(
        'STUDENT',
        'user@example.com',
        undefined,
        '1',
        '10',
      );
      expect(response).toEqual({
        data: [{ id: '1', email: 'user@example.com' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockAdminService.getUsers).toHaveBeenCalledWith(
        { roles: ['STUDENT'], email: 'user@example.com' },
        1,
        10,
      );
    });
  });

  describe('getCourses', () => {
    it('должен возвращать список курсов с пагинацией', async () => {
      const result = {
        data: [{ title: 'Математика' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockAdminService.getCourses.mockResolvedValue(result);

      const query: GetCoursesDto = { title: 'Математика', page: 1, limit: 10 };
      const response = await controller.getCourses(query);
      expect(response).toEqual(result);
      expect(mockAdminService.getCourses).toHaveBeenCalledWith(query);
    });
  });

  describe('getEnrollments', () => {
    it('должен возвращать список записей о зачислении', async () => {
      const result = {
        enrollments: [{ userId: '1', courseId: '2' }],
        total: 1,
      };
      mockAdminService.getEnrollments.mockResolvedValue(result);

      const query: GetEnrollmentsDto = { courseId: '2', page: 1, limit: 10 };
      const response = await controller.getEnrollments(query);
      expect(response).toEqual({
        data: result.enrollments,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('getNotifications', () => {
    it('должен возвращать список уведомлений', async () => {
      const result = {
        data: [{ message: 'Test' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockAdminService.getNotifications.mockResolvedValue(result);

      const query: GetNotificationsDto = { userId: '1', page: 1, limit: 10 };
      const response = await controller.getNotifications(query);
      expect(response).toEqual(result);
    });
  });

  describe('getActivity', () => {
    it('должен возвращать сводку по активности', async () => {
      const result = {
        totalUsers: 10,
        totalCourses: 5,
        totalEnrollments: 20,
        totalNotifications: 30,
      };
      mockAdminService.getActivity.mockResolvedValue(result);

      const query: GetActivityDto = { startDate: '2025-01-01T00:00:00Z' };
      const response = await controller.getActivity(query);
      expect(response).toEqual(result);
      expect(mockAdminService.getActivity).toHaveBeenCalledWith(query);
    });
  });
});
