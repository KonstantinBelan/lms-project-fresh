import { Test, TestingModule } from '@nestjs/testing';
import { HomeworksService, IHomework } from './homeworks.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('HomeworksService', () => {
  let service: HomeworksService;
  let homeworkModel: any;
  let submissionModel: any;

  const mockHomeworkModel = {
    find: jest.fn().mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    }),
    findById: jest.fn().mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    }),
    findByIdAndDelete: jest.fn().mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    }),
  };

  const mockSubmissionModel = {
    find: jest.fn().mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    }),
    findById: jest.fn().mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      lean: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    }),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworksService,
        { provide: getModelToken('Homework'), useValue: mockHomeworkModel },
        { provide: getModelToken('Submission'), useValue: mockSubmissionModel },
        {
          provide: NotificationsService,
          useValue: {
            notifyDeadline: jest.fn(),
            getNotificationByKey: jest.fn(),
            createNotification: jest.fn(),
            sendNotificationToUser: jest.fn(),
          },
        },
        {
          provide: CoursesService,
          useValue: {
            findCourseByLesson: jest.fn(),
            getLessonsForCourse: jest.fn(),
          },
        },
        {
          provide: EnrollmentsService,
          useValue: {
            awardPoints: jest.fn(),
            updateStudentProgress: jest.fn(),
            findEnrollmentsByStudent: jest.fn(),
          },
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<HomeworksService>(HomeworksService);
    homeworkModel = module.get(getModelToken('Homework'));
    submissionModel = module.get(getModelToken('Submission'));
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  describe('findHomeworkById', () => {
    it('должен выбросить исключение при некорректном ID', async () => {
      await expect(service.findHomeworkById('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('должен вернуть null, если задание не найдено', async () => {
      const result = await service.findHomeworkById('507f1f77bcf86cd799439011');
      expect(result).toBeNull();
    });

    it('должен вернуть задание из базы', async () => {
      const homework: IHomework = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        description: 'Тест',
        lessonId: new Types.ObjectId(),
      };
      homeworkModel.findById.mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(homework) }),
      });
      const result = await service.findHomeworkById('507f1f77bcf86cd799439011');
      expect(result).toEqual(homework);
    });
  });

  describe('createHomework', () => {
    it('должен создать новое домашнее задание', async () => {
      const dto = {
        lessonId: '507f1f77bcf86cd799439011',
        description: 'Тест',
        deadline: '2025-03-20',
      };
      const savedHomework: IHomework = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        ...dto,
        lessonId: new Types.ObjectId(dto.lessonId),
      };
      jest
        .spyOn(homeworkModel.prototype, 'save')
        .mockResolvedValue({ toObject: () => savedHomework });
      const result = await service.createHomework(dto);
      expect(result).toEqual(savedHomework);
    });

    it('должен выбросить исключение при некорректной дате', async () => {
      const dto = {
        lessonId: '507f1f77bcf86cd799439011',
        description: 'Тест',
        deadline: 'invalid-date',
      };
      await expect(service.createHomework(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
