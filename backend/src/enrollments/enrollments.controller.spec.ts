// backend/src/enrollments/enrollments.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  const mockEnrollmentsService = {
    findEnrollmentById: jest.fn().mockResolvedValue({
      _id: '67c59acebe3880a60e6f53b1',
      studentId: new Types.ObjectId('67c4d379a5c903e26a37557c'),
      courseId: new Types.ObjectId('67c585ff05ac038b1bf9c1a9'),
      completedModules: [new Types.ObjectId('67c58261d8f478d10a0dfce0')],
      completedLessons: [new Types.ObjectId('67c58285d8f478d10a0dfce5')],
      isCompleted: false,
      deadline: new Date('2025-03-15T00:00:00.000Z'),
      __v: 0,
    }),
    updateStudentProgress: jest.fn().mockResolvedValue({
      _id: '67c59acebe3880a60e6f53b1',
      studentId: new Types.ObjectId('67c4d379a5c903e26a37557c'),
      courseId: new Types.ObjectId('67c585ff05ac038b1bf9c1a9'),
      completedModules: [
        new Types.ObjectId('67c58261d8f478d10a0dfce0'),
        new Types.ObjectId('67c5861505ac038b1bf9c1af'),
      ],
      completedLessons: [
        new Types.ObjectId('67c58285d8f478d10a0dfce5'),
        new Types.ObjectId('67c5862905ac038b1bf9c1b5'),
      ],
      isCompleted: false,
      deadline: new Date('2025-03-15T00:00:00.000Z'),
      __v: 0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProgress', () => {
    it('should update student progress with new module and lesson', async () => {
      const enrollmentId = '67c59acebe3880a60e6f53b1';
      const updateProgressDto = {
        moduleId: '67c5861505ac038b1bf9c1af',
        lessonId: '67c5862905ac038b1bf9c1b5',
      };

      const result = await controller.updateProgress(
        enrollmentId,
        updateProgressDto,
      );

      expect(mockEnrollmentsService.findEnrollmentById).toHaveBeenCalledWith(
        enrollmentId,
      );
      expect(mockEnrollmentsService.updateStudentProgress).toHaveBeenCalledWith(
        '67c4d379a5c903e26a37557c',
        '67c585ff05ac038b1bf9c1a9',
        updateProgressDto.moduleId,
        updateProgressDto.lessonId,
      );
      expect(
        result.completedModules.map((id: Types.ObjectId) => id.toString()),
      ).toContain('67c5861505ac038b1bf9c1af');
      expect(
        result.completedLessons.map((id: Types.ObjectId) => id.toString()),
      ).toContain('67c5862905ac038b1bf9c1b5');
    });

    it('should throw BadRequestException if enrollment not found', async () => {
      mockEnrollmentsService.findEnrollmentById.mockResolvedValue(null);
      await expect(
        controller.updateProgress('invalidId', {
          moduleId: 'm1',
          lessonId: 'l1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
