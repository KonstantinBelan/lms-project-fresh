import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Types } from 'mongoose';

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
    }),
    createEnrollment: jest.fn().mockResolvedValue({
      _id: '67c59acebe3880a60e6f53b1',
      studentId: new Types.ObjectId('67c4d379a5c903e26a37557c'),
      courseId: new Types.ObjectId('67c585ff05ac038b1bf9c1a9'),
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

  afterEach(() => jest.clearAllMocks());

  describe('updateProgress', () => {
    it('должен обновить прогресс студента с новым модулем и уроком', async () => {
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
      expect(result).toBeDefined();
      expect(result!.completedModules.map((id) => id.toString())).toContain(
        '67c5861505ac038b1bf9c1af',
      );
    });

    it('должен выбросить ошибку, если зачисление не найдено', async () => {
      mockEnrollmentsService.findEnrollmentById.mockResolvedValue(null);
      const enrollmentId = '67c59acebe3880a60e6f53b1';
      const updateProgressDto = {
        moduleId: '67c5861505ac038b1bf9c1af',
        lessonId: '67c5862905ac038b1bf9c1b5',
      };

      await expect(
        controller.updateProgress(enrollmentId, updateProgressDto),
      ).rejects.toThrow('Зачисление не найдено');
    });
  });

  describe('create', () => {
    it('должен создать новое зачисление', async () => {
      const createEnrollmentDto = {
        studentId: '67c4d379a5c903e26a37557c',
        courseId: '67c585ff05ac038b1bf9c1a9',
        deadline: '2025-03-15T00:00:00.000Z',
      };

      const result = await controller.create(createEnrollmentDto);

      expect(mockEnrollmentsService.createEnrollment).toHaveBeenCalledWith(
        createEnrollmentDto.studentId,
        createEnrollmentDto.courseId,
        new Date(createEnrollmentDto.deadline),
        undefined,
        undefined,
      );
      expect(result).toBeDefined();
      expect(result._id).toBe('67c59acebe3880a60e6f53b1');
    });
  });

  describe('completeCourse', () => {
    it('должен завершить курс с заданной оценкой', async () => {
      const enrollmentId = '67c59acebe3880a60e6f53b1';
      const completeCourseDto = { grade: 90 };
      mockEnrollmentsService.completeCourse.mockResolvedValue({
        _id: enrollmentId,
        studentId: new Types.ObjectId('67c4d379a5c903e26a37557c'),
        courseId: new Types.ObjectId('67c585ff05ac038b1bf9c1a9'),
        isCompleted: true,
        grade: 90,
      });

      const result = await controller.completeCourse(
        enrollmentId,
        completeCourseDto,
      );

      expect(mockEnrollmentsService.completeCourse).toHaveBeenCalledWith(
        enrollmentId,
        90,
      );
      expect(result).toBeDefined();
      expect(result.isCompleted).toBe(true);
      expect(result.grade).toBe(90);
    });
  });

  describe('getProgress', () => {
    it('должен вернуть прогресс студента по курсу', async () => {
      const studentId = '67c4d379a5c903e26a37557c';
      const courseId = '67c585ff05ac038b1bf9c1a9';
      mockEnrollmentsService.getStudentProgress.mockResolvedValue({
        studentId,
        courseId,
        completedModules: 2,
        totalModules: 5,
        completedLessons: 10,
        totalLessons: 20,
        points: 50,
        completionPercentage: 50,
        completedModuleIds: ['67c58261d8f478d10a0dfce0'],
        completedLessonIds: ['67c58285d8f478d10a0dfce5'],
        avgHomeworkGrade: 85,
        avgQuizScore: 90,
      });

      const result = await controller.getProgress(studentId, courseId);

      expect(mockEnrollmentsService.getStudentProgress).toHaveBeenCalledWith(
        studentId,
        courseId,
      );
      expect(result).toBeDefined();
      expect(result.completionPercentage).toBe(50);
    });
  });

  describe('completeLesson', () => {
    it('должен завершить урок и вернуть обновленное зачисление', async () => {
      const studentId = '507f1f77bcf86cd799439011';
      const courseId = '507f1f77bcf86cd799439012';
      const lessonId = '507f1f77bcf86cd799439013';
      mockEnrollmentsService.completeLesson.mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        studentId,
        courseId,
        completedLessons: [lessonId],
        points: 10,
        isCompleted: false,
      });

      const result = await controller.completeLesson(
        studentId,
        courseId,
        lessonId,
      );

      expect(mockEnrollmentsService.completeLesson).toHaveBeenCalledWith(
        studentId,
        courseId,
        lessonId,
      );
      expect(result).toBeDefined();
      expect(result.completedLessons).toContain(lessonId);
    });
  });
});
