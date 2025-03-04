import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Types } from 'mongoose';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  const mockEnrollmentsService = {
    findEnrollmentById: jest.fn().mockResolvedValue({
      _id: new Types.ObjectId('67c59acebe3880a60e6f53b1'),
      studentId: new Types.ObjectId('67c4d379a5c903e26a37557c'),
      courseId: new Types.ObjectId('67c585ff05ac038b1bf9c1a9'),
      completedModules: [new Types.ObjectId('67c58261d8f478d10a0dfce0')],
      completedLessons: [new Types.ObjectId('67c58285d8f478d10a0dfce5')],
      isCompleted: false,
      deadline: new Date('2025-03-15T00:00:00.000Z'),
      __v: 0,
    }),
    updateStudentProgress: jest.fn().mockResolvedValue({
      _id: new Types.ObjectId('67c59acebe3880a60e6f53b1'),
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
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
  });

  it('should update progress with moduleId and lessonId', async () => {
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
      '67c4d379a5c903e26a37557c', // studentId
      '67c585ff05ac038b1bf9c1a9', // courseId
      updateProgressDto.moduleId,
      updateProgressDto.lessonId,
    );
    expect(result).toEqual({
      _id: expect.any(Types.ObjectId),
      studentId: expect.any(Types.ObjectId),
      courseId: expect.any(Types.ObjectId),
      completedModules: [
        new Types.ObjectId('67c58261d8f478d10a0dfce0'),
        new Types.ObjectId('67c5861505ac038b1bf9c1af'),
      ],
      completedLessons: [
        new Types.ObjectId('67c58285d8f478d10a0dfce5'),
        new Types.ObjectId('67c5862905ac038b1bf9c1b5'),
      ],
      isCompleted: false,
      deadline: expect.any(Date),
      __v: 0,
    });
  });
});
