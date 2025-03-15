import { Test, TestingModule } from '@nestjs/testing';
import { HomeworksService } from './homeworks.service';
import { getModelToken } from '@nestjs/mongoose';
import { Homework, HomeworkDocument } from './schemas/homework.schema';
import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';

describe('HomeworksService - updateHomework', () => {
  let service: HomeworksService;
  let homeworkModel: any;

  const mockHomework = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    lessonId: new Types.ObjectId('507f1f77bcf86cd799439012'),
    description: 'Старое описание',
    category: 'practice',
    deadline: new Date('2025-03-20'),
    isActive: true,
    points: 10,
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworksService,
        {
          provide: getModelToken(Homework.name),
          useValue: {
            findByIdAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(Submission.name),
          useValue: {},
        },
        {
          provide: NotificationsService,
          useValue: {},
        },
        {
          provide: CoursesService,
          useValue: {},
        },
        {
          provide: EnrollmentsService,
          useValue: {},
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<HomeworksService>(HomeworksService);
    homeworkModel = module.get(getModelToken(Homework.name));
  });

  it('должен успешно обновить домашнее задание', async () => {
    const updateDto: UpdateHomeworkDto = {
      description: 'Новое описание',
      points: 25,
    };
    homeworkModel.findByIdAndUpdate.mockResolvedValue({
      ...mockHomework,
      ...updateDto,
    });

    const result = await service.updateHomework(
      mockHomework._id.toString(),
      updateDto,
    );

    expect(homeworkModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockHomework._id.toString(),
      expect.objectContaining({
        description: 'Новое описание',
        points: 25,
      }),
      { new: true, runValidators: true },
    );
    expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
    expect(result.description).toBe('Новое описание');
    expect(result.points).toBe(25);
  });

  it('должен выбросить исключение при невалидном ID', async () => {
    const updateDto: UpdateHomeworkDto = { description: 'Новое описание' };
    await expect(
      service.updateHomework('invalid-id', updateDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('должен выбросить исключение, если задание не найдено', async () => {
    homeworkModel.findByIdAndUpdate.mockResolvedValue(null);
    const updateDto: UpdateHomeworkDto = { description: 'Новое описание' };
    await expect(
      service.updateHomework(mockHomework._id.toString(), updateDto),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('HomeworksService - createSubmission', () => {
  let service: HomeworksService;
  let submissionModel: any;
  let homeworkModel: any;
  let notificationsService: any;
  let coursesService: any;
  let enrollmentsService: any;
  let cacheManager: any;

  const mockSubmissionDto: CreateSubmissionDto = {
    homeworkId: '507f1f77bcf86cd799439011',
    studentId: '507f1f77bcf86cd799439012',
    submissionContent: 'Моё решение: реализовал API',
  };

  const mockHomework = {
    _id: new Types.ObjectId(mockSubmissionDto.homeworkId),
    lessonId: new Types.ObjectId('507f1f77bcf86cd799439013'),
    description: 'Написать API',
    points: 20,
  };

  const mockCourse = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
    title: 'Nest.js Basics',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworksService,
        {
          provide: getModelToken(Homework.name),
          useValue: { findById: jest.fn() },
        },
        {
          provide: getModelToken(Submission.name),
          useValue: { save: jest.fn(), constructor: jest.fn() },
        },
        {
          provide: NotificationsService,
          useValue: {
            getNotificationByKey: jest.fn(),
            replacePlaceholders: jest.fn(),
            createNotification: jest.fn(),
            sendNotificationToUser: jest.fn(),
          },
        },
        {
          provide: CoursesService,
          useValue: { findCourseByLesson: jest.fn() },
        },
        {
          provide: EnrollmentsService,
          useValue: { awardPoints: jest.fn() },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { del: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<HomeworksService>(HomeworksService);
    homeworkModel = module.get(getModelToken(Homework.name));
    submissionModel = module.get(getModelToken(Submission.name));
    notificationsService = module.get(NotificationsService);
    coursesService = module.get(CoursesService);
    enrollmentsService = module.get(EnrollmentsService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('должен успешно создать решение', async () => {
    homeworkModel.findById.mockResolvedValue(mockHomework);
    coursesService.findCourseByLesson.mockResolvedValue(mockCourse);
    enrollmentsService.awardPoints.mockResolvedValue(true);
    notificationsService.getNotificationByKey.mockResolvedValue({
      title: 'Новое решение',
      message: 'Вы заработали {points} баллов',
    });
    notificationsService.replacePlaceholders.mockReturnValue(
      'Вы заработали 20 баллов',
    );
    notificationsService.createNotification.mockResolvedValue({
      _id: new Types.ObjectId(),
    });
    submissionModel.constructor.mockReturnValue({
      save: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        ...mockSubmissionDto,
      }),
    });

    const result = await service.createSubmission(mockSubmissionDto);

    expect(submissionModel.constructor).toHaveBeenCalledWith({
      ...mockSubmissionDto,
      homeworkId: expect.any(Types.ObjectId),
      studentId: expect.any(Types.ObjectId),
    });
    expect(enrollmentsService.awardPoints).toHaveBeenCalledWith(
      mockSubmissionDto.studentId,
      mockCourse._id.toString(),
      20,
    );
    expect(notificationsService.sendNotificationToUser).toHaveBeenCalled();
    expect(result.submissionContent).toBe(mockSubmissionDto.submissionContent);
  });

  it('должен выбросить исключение при невалидном homeworkId', async () => {
    const invalidDto = { ...mockSubmissionDto, homeworkId: 'invalid-id' };
    await expect(service.createSubmission(invalidDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('должен выбросить исключение, если домашнее задание не найдено', async () => {
    homeworkModel.findById.mockResolvedValue(null);
    await expect(service.createSubmission(mockSubmissionDto)).rejects.toThrow(
      NotFoundException,
    );
  });
});
