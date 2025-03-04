import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  const mockEnrollmentsService = {
    createEnrollment: jest
      .fn()
      .mockResolvedValue({ _id: '67c585ff05ac038b1bf9c1a9' }),
    updateStudentProgress: jest
      .fn()
      .mockResolvedValue({ completedModules: ['module1'] }),
    getDetailedStudentProgress: jest
      .fn()
      .mockResolvedValue([
        { courseId: '67c585ff05ac038b1bf9c1a9', progress: 50 },
      ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
  });

  it('should update progress', async () => {
    const result = await controller.updateProgress('67c585ff05ac038b1bf9c1a9', {
      completedModules: ['module1'],
      completedLessons: ['lesson1'],
    });
    expect(result.completedModules).toContain('module1');
    expect(mockEnrollmentsService.updateStudentProgress).toHaveBeenCalled();
  });

  it('should get detailed progress', async () => {
    const result = await controller.getDetailedStudentProgress(
      '67c4d379a5c903e26a37557c',
    );
    expect(result).toHaveLength(1);
    expect(
      mockEnrollmentsService.getDetailedStudentProgress,
    ).toHaveBeenCalledWith('67c4d379a5c903e26a37557c');
  });
});
